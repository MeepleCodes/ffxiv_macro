import { CursorDirection, MoveDistance, TextModel } from './TextModel';
import { Font, Glyph, isRawFont, mapRawFont } from './Font';
import log from 'loglevel';
const logger = log.getLogger("TextEditor");
const logRender = log.getLogger("TextEditor.render");
logRender.setLevel(log.levels.INFO);
log.setLevel(log.levels.INFO, true);

// Fixed width of fake selection to show when a selection spans lines
const SELECTED_NEWLINE_WIDTH = 3;
// Additional rendering space needed at the end of a line of text
// Must be at least 2 (1px wide cursor 1px past the end of the line)
const LINE_WIDTH_MARGIN = Math.max(2, SELECTED_NEWLINE_WIDTH);
const STYLESHEET = `
    :host {
        border: 1px solid black;
        cursor: text;
        overflow: auto;
        width: 200px;
        height: 100px;
        padding: 2px;
        position: relative;
    }
    slot {
        display: none;
    }
    #container {
        position: relative;
        width: 100%;
        height: 100%;
    }
    slot[name="spinner"], #error {
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, .5);
        position: absolute;
        top: 0; bottom: 0; right: 0; left: 0;
    }
    #error {
        flex-direction: column;
    }
    [hidden] { display: none !important; }
    .lds-dual-ring {
        display: inline-block;
        width: 80px;
        height: 80px;
      }
      .lds-dual-ring:after {
        content: " ";
        display: block;
        width: 64px;
        height: 64px;
        margin: 8px;
        border-radius: 50%;
        border: 6px solid #fff;
        border-color: #fff transparent #fff transparent;
        animation: lds-dual-ring 1.2s linear infinite;
      }
      @keyframes lds-dual-ring {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
      
`;

interface Coordinate {
    x: number;
    y: number;
}
type EventMap = {
    [type in keyof HTMLElementEventMap]?: {
        handler: (this: Ready, evt: HTMLElementEventMap[type]) => void,
        // handler: any,
        source: (that: TextEditor) => DocumentAndElementEventHandlers,
        requiresReady: boolean
    }
}
const EVENT_MAP: EventMap = {};

function Handler(type: keyof HTMLElementEventMap, eventSource: (that: TextEditor) => DocumentAndElementEventHandlers = (that: TextEditor) => that, requiresReady = true) {
    return function (target: TextEditor, propertyKey: any, descriptor: PropertyDescriptor) {
        EVENT_MAP[type] = {
            handler: target[propertyKey as keyof TextEditor] as any,
            source: eventSource,
            requiresReady
        };
    }
}

export class TextEditor extends HTMLElement implements EventListenerObject {
    
    protected text = new TextModel();
    protected _fontSrc: string = "";
    public get fontSrc() {
        return this._fontSrc;
    }
    public set fontSrc(newValue: string) {
        if(this._fontSrc !== newValue) {
            this._fontSrc = newValue;
            this.loadFont(newValue);
        }
    }
    // Optional fields that aren't optional once we're ready to render
    protected font?: Font;
    protected fontTexture?: ImageBitmap;
    // The margin around the cursor to try and keep visible when scrolling
    protected scrollMargin = {left: 1, right: 1, top: 1, bottom: 1};
    // Pixel coordinates of the caret/typing cursor, relative to the canvas element
    protected caret: Coordinate = {x: 0, y: 0};

    public get cursorX() {
        return this.caret.x;
    }
    public get cursorY() {
        return this.caret.y;
    }
    public get cursorRow() {
        return this.text.cursorRow;
    }
    public get cursorCol() {
        return this.text.cursorCol;
    }
    public get selectionLength() {
        return [...this.text.selection].length;
    }
    public get selectionPixels(): number | null {
        const anchor = this.text.selectionAnchor;
        if(anchor !== null && this.isReady() && this.text.selectionAnchor !== null) {
            // FIXME: this is janky, need better typing in TextModel
            // FIXME: Should we just update this as needed like we do with this.caret?
            const coord = this.coordinateFromCursor(this.text.selectionAnchor);
            // console.log("Pixel length from ", this.caret, coord);
            if(coord.y === this.caret.y) return Math.abs(coord.x - this.caret.x);
        }
        return null;
    }
    public getText() {
        return this.text.text;
    }
    public async getThumbnail() {
        return new Promise<Blob>((resolve, reject) => this.canvas.toBlob((blob) => blob !== null ? resolve(blob) : reject));
    }
    // Pixel coordinates of the drag/drop insertion cursor, or null if we're not
    // currently dropping anything
    protected insertion: Coordinate | null = null;
    
    // Interval between caret on/off, in ms
    protected blinkInterval = 500;
    // Whether the caret is currently blinking (meaning invisible)
    protected blink = false;
    // Whether the editor has focus; the caret isn't shown if not
    protected hasFocus = false;
    // Reference for the setInterval return used to control the caret blink
    protected intervalRef: ReturnType<typeof setInterval> | null = null;

    // A select operation is currently in progress (between mousedown and mouseup)
    protected selecting = false;
    // A drag operation (with us as the source) is in progress (between dragstart and dragend)
    protected dragging = false;

    // HTMLElements used to build the shadow DOM
    protected stylesheet: HTMLStyleElement;
    protected canvas: HTMLCanvasElement;
    protected slotElement: HTMLSlotElement;
    protected spinner: HTMLSlotElement;
    protected errorElement: HTMLDivElement;
    protected errorMessage: HTMLParagraphElement;
    protected container: HTMLDivElement;

    // Elements not in the DOM that are used for buffers
    protected selectBuffer: HTMLCanvasElement;
    protected textBuffer: HTMLCanvasElement;
    protected cursorBuffer: HTMLCanvasElement;
    protected dragImage: HTMLImageElement = new Image();

    // Helpful getters for sets of canvas elements
    protected get canvases() {
        return [this.canvas, this.selectBuffer, this.textBuffer, this.cursorBuffer];
    }
    protected get buffers() {
        return [this.selectBuffer, this.textBuffer, this.cursorBuffer];
    }

    constructor() {
        super();
        this.attachShadow({mode: "open"});
        // Maybe this should be done with an innerHTML'd template
        // and clone, then pick the nodes out with querySelector()
        this.canvas = document.createElement("canvas");
        
        this.stylesheet = document.createElement("style");
        this.stylesheet.innerHTML = STYLESHEET;
        this.container = document.createElement("div");
        this.container.id = "container";

        this.slotElement = document.createElement("slot");
        
        this.spinner = document.createElement("slot");
        this.spinner.name = "spinner";
        this.spinner.hidden = true;
        const defaultSpinner = document.createElement("div");
        defaultSpinner.className = "lds-dual-ring";
        this.spinner.appendChild(defaultSpinner);
        
        this.errorElement = document.createElement("div");
        this.errorElement.id="error";
        this.errorElement.hidden = true;
        const errorTitle = document.createElement("h1");
        errorTitle.innerText = "Error";
        this.errorElement.appendChild(errorTitle);

        this.errorMessage = document.createElement("p");
        this.errorElement.appendChild(this.errorMessage);

        // The buffer canvases for rendering the layers separately
        // These could probably be OffscreenCanvas objects
        this.selectBuffer = document.createElement("canvas");
        // Mark the select buffer's context for frequent reads
        this.selectBuffer.getContext("2d", {willReadFrequently: true});
        this.textBuffer = document.createElement("canvas");
        this.cursorBuffer = document.createElement("canvas");
        
    }

    public static get observedAttributes(): string[] {
        return ["fontsrc", "value"];
    }
    public attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        switch(name) {
            case "fontsrc": {
                this.fontSrc = newValue;
                break;
            }
            case "value": {
                this.text.reset(newValue);
                if(this.isReady()) this.postUpdate();
                break;
            }
            default:
                console.log(name, "set to", newValue, typeof(newValue));
            
        }
      }
    public connectedCallback() {
        if(this.isConnected) {
            
            this.setAttribute("contenteditable", "");
            this.setAttribute("tab-index", "0");
            this.setAttribute("draggable", "true");
            this.setAttribute("aria-role", "textarea");
            this.setAttribute("aria-multiline", "true");

            const container = this.container;

            container.appendChild(this.stylesheet);
            container.appendChild(this.canvas);
            
            container.appendChild(this.slotElement);

            container.appendChild(this.spinner);
            container.appendChild(this.errorElement);

            this.shadowRoot?.appendChild(container);

            this.slotElement.addEventListener("slotchange", this);

            for(const [event, eventMap] of Object.entries(EVENT_MAP)) {
                eventMap.source(this).addEventListener(event, this);
            }
            if(!this.fontSrc || this.fontSrc === "") {
                this.showError("Need a fontSrc");
            }
        }
    }
    public disconnectedCallback() {
        if(this.intervalRef) clearInterval(this.intervalRef);
        for(const [event, eventMap] of Object.entries(EVENT_MAP)) {
            eventMap.source(this).removeEventListener(event, this);
        }

    }
    public handleEvent(e: Event) : void {
        const map = EVENT_MAP[e.type as keyof EventMap];
        if(map !== undefined && (this.isReady() || !map.requiresReady)) {
            (map.handler as any).call(this, e as any as keyof HTMLElementEventMap);
        }
    }

    public ready(): this is typeof this & {font: Font} {
        return this.font !== null;
    }

    public insert(text: string) {
        this.text.insert(text);
    }
    protected setSpinner(hidden = true) {
        this.spinner.hidden = hidden;
    }
    protected hideError() {
        this.errorElement.hidden = true;
    }
    protected showError(message: string) {
        this.errorMessage.innerText = message;
        this.errorElement.hidden = false;
        this.spinner.hidden = true;
    }
    protected async loadFont(src: string) {
        this.spinner.hidden = false;
        this.errorElement.hidden = true;
        try {
            const fontResp = await fetch(src);
            if(!fontResp.ok) throw new Error(`Couldn't fetch font JSON data: ${fontResp.status} ${fontResp.statusText}`);
            const json = await fontResp.json();
            if(!isRawFont(json)) {
                console.error("Font JSON wasn't RawFont", json);
                throw new Error("Got invalid font JSON data");
            }
            const font: Font = mapRawFont(json);
            // Try and make a URL from the src property of the font JSON, but if it's a relative path this will fail
            const texURL = new URL(font.src, new URL(fontResp.url));
            const texResp = await(fetch(texURL));

            if(!texResp.ok) throw new Error(`Couldn't fetch font texture data: ${texResp.status} ${texResp.statusText}`);
            const blob = await texResp.blob();
            this.fontTexture = await createImageBitmap(blob);
            this.font = font;
            this.spinner.hidden = true;
            if(!this.isReady()) {
                console.error("Loaded font and texture but still not ready");
            } else {
                this.redraw();
            }
        } catch(e) {
            console.error(e);
            this.showError("Error loading");
        }
       
        
    }
    protected setFont(font: Font) {
        this.font = font;
        this.scrollMargin = {
            left: this.font.maxWidth * 2,
            right: this.font.maxWidth,
            top: 0,
            bottom: this.font.lineHeight * 2
        };
    }
    protected restartBlinking(this: Ready) {
        this.blink = false;
        if(this.intervalRef) clearInterval(this.intervalRef);
        this.intervalRef = setInterval(() => {
            this.blink = !this.blink;
            this.redraw();
        }, this.blinkInterval)        
    }
    protected get cursorVisible(): boolean {
        return this.hasFocus && !this.blink;
    }
    /**
     * Get the font glyph for a given codepoint, or the default.
     */
    protected getGlyph(this: Ready, cpChar: string): Glyph {
        const codepoint = cpChar.codePointAt(0);
        if(codepoint === undefined || !this.font.glyphMap[codepoint] === undefined) return this.font.defaultGlyph;
        return this.font.glyphMap[codepoint];
    }
    
    protected coordinateFromEvent(this: Ready, ev: MouseEvent, snap = false): Coordinate {
        // Correct for scrolling, but not padding (as the offsetX/Y already does
        // that for us)
        let offsetLeft = this.container.offsetLeft;
        let offsetTop = this.container.offsetTop;
        // If the text-editor element has a position of 'relative' then it will
        // be the offsetParent of the container, otherwise both will have a common
        // offsetParent further up the DOM tree (oddly I don't think you can
        // prevent this even though it sort of breaches the shadow DOM).
        if(this.container.offsetParent !== this) {
            offsetLeft -= this.offsetLeft;
            offsetTop -= this.offsetTop;
        }
        let {x, y} = {
            x: ev.offsetX + this.scrollLeft - offsetLeft,
            y: ev.offsetY + this.scrollTop - offsetTop
        }
        if(snap) {
            
            // assume a 1:1 canvas pixel to HTML document ratio
            // Not sure if this is actually true or how to correct if it isn't
            let cY = Math.max(0, Math.floor(y / this.font.lineHeight))
    
            // If you're just below the last line, pretend you're in the
            // last line. Otherwise, jump to the very last character
            if(cY === this.text.lineLengths.length) {
                cY = this.text.lineLengths.length - 1;
            } else if(cY > this.text.lineLengths.length) {
                cY = this.text.lineLengths.length - 1;
                x = Infinity;
            }
            const line = this.text.text.split("\n")[cY];
            let lastX = 0;
            // console.log("Finding snap X for", x);
            this.forGlyphInLine(line, (glyph, pixelX, advanceWidth, col) => {
                
                if(x <= pixelX + (advanceWidth / 2)) {
                    lastX = pixelX;
                    // console.log("Snapping to left of col", col, "at", lastX);
                    return false;
                } else if(x <= pixelX + advanceWidth) {
                    lastX = pixelX + advanceWidth;
                    // console.log("Snapping to right of col", col, "at", lastX);
                    return false;
                } else {
                    // Always update in case we fall off the end of the line
                    lastX = pixelX;
                    return true;
                }
            });
            x = lastX;
            y = cY * this.font.lineHeight;
        }

        return {x, y};
    }

    protected eventWithinSelection(this: Ready, ev: MouseEvent): boolean {
        // Shortcut: can't be within a selection that doesn't exist
        if(this.text.selection.length === 0) return false;
        let {x, y} = this.coordinateFromEvent(ev);
        let ctx = this.selectBuffer.getContext("2d");
        let data = ctx?.getImageData(x, y, 1, 1).data;
        // If the alpha channel is zero we clicked on an empty bit of
        // the select buffer
        return data !== undefined && data[3] > 0;
    }

    // FIXME: Merge with coordinateFromEvent
    protected cursorXYFromEvent(this: Ready, ev: MouseEvent): [number, number] {
        let {x, y} = this.coordinateFromEvent(ev);
        // assume a 1:1 canvas pixel to HTML document ratio
        // Not sure if this is actually true or how to correct if it isn't
        let cY = Math.max(0, Math.floor(y / this.font.lineHeight))

        // If you click just below the last line, pretend you clicked in the
        // last line. Otherwise, jump to the very last character
        if(cY === this.text.lineLengths.length) {
            cY = this.text.lineLengths.length - 1;
        } else if(cY > this.text.lineLengths.length) {
            return this.text.eofXY();
        }
        const line = this.text.text.split("\n")[cY];
        let pixelX = 0;
        let cX = 0;
        this.forGlyphInLine(line, (glyph, x_, advanceWidth, col) => {
            if(x <= pixelX + (advanceWidth / 2)) {
                return false;
            } else if(x <= pixelX + advanceWidth) {
                cX++;
                return false;
            }
            cX++;
            pixelX += advanceWidth;
            return true;
        });
        return [cX, cY];
    }
    // TODO: Pull {row, col} into a Cursor type, put it in TextModel
    // FIXME: Don't calcualte this on the fly, save it after each update like we do with caret
    protected coordinateFromCursor(this: Ready, {row: searchRow, col: searchCol}: {row: number, col: number}): Coordinate {
        let result: Coordinate = {x: 0, y: 0};
        this.forGlyphInText((glyph, x, y, advanceWidth, row, col, c) => {
            // Always save result, but stop processing when it's correct
            result = {x, y};
            if(row === searchRow && col === searchCol) {
                return false;
            }
            return true
        }, (x, y, row, col, c) => {
            result = {x, y};
            if(row === searchRow && col === searchCol) {
                return false;
            }
            return true
        });
        return result;
    }
    protected getKerning(this: Ready, leftClass: number, rightClass: number): number {
        return this.font.kerningMap[leftClass]?.[rightClass] || 0;
    }
    protected forGlyphInText(this: Ready, eachGlyph: (glyph: Glyph, x: number, y: number, advanceWidth: number, row: number, col: number, character: number) => boolean, lineEnd?: (x: number, y: number, row: number, col: number, character: number) => boolean) {
        let y = 0, character  = 0, lineWidth = 0, row = 0;
        // Stop TS narrowing from boolean to true because we know function side effects can un-narrow it again
        let keepProcessing: boolean = true as boolean;
        const perGlyph = (glyph: Glyph, x: number, advanceWidth: number, col: number) => {
            lineWidth = Math.max(x + advanceWidth, x + glyph.w);
            keepProcessing = eachGlyph(glyph, x, y, advanceWidth, row, col, character);
            character++;
            return keepProcessing;
        };
        for(const line of this.text.text.split("\n")) {
            logger.debug("Line starting from", character);
            lineWidth = 0;
            this.forGlyphInLine(line, perGlyph);
            if(keepProcessing === false) break;
            if(lineEnd !== undefined && lineEnd(lineWidth, y, row, [...line].length, character) === false) break;
            // Increment character again to account for the newline
            character++;
            row++;
            logger.debug("Next line will start at", character);
            y += this.font.lineHeight;
        }
    }
    protected forGlyphInLine(this: Ready, line: string, callback: (glyph: Glyph, x: number, advanceWidth: number, col: number) => boolean) {
        const glyphs = [...line].map(c => this.getGlyph(c));
        let x = 0, c = 0;
        for(const [i, glyph] of glyphs.entries()) {
            let advanceWidth = glyph.w + glyph.right;
            // Look ahead by one to see if we need to apply kerning
            if(i < glyphs.length - 1) {
                const nextGlyph = glyphs[i + 1];
                const kerning = this.getKerning(glyph.kerningClass, nextGlyph.kerningClass);
                advanceWidth += kerning;
            }
            if(callback(glyph, x, advanceWidth, c) === false) break;
            x += advanceWidth;
            c += 1;
        }        
    }
    /**
     * Calculate a safe size for a canvas to draw the current text content on
     * 
     * Will be a gross over-estimate but avoids clipping
     */
    protected safeSize(this: Ready): [number, number] {
        return [(Math.max(...this.text.lineLengths) + 1) * this.font.lineHeight * 2 + 10, (this.text.lineLengths.length + 1) * this.font.lineHeight + 10];
    }
    
    protected redraw(this: Ready): void {
        const contexts = this.canvases.map(c => c.getContext("2d"));
        const [context, selectContext, textContext, cursorContext] = contexts;
        if(!context || !selectContext || !textContext || !cursorContext) return;
        const drawSize = this.safeSize();
        this.buffers.forEach(b => [b.width, b.height] = drawSize);
        
        
        // TODO: Customise these
        selectContext.fillStyle = "#a0a0ff";
        cursorContext.strokeStyle = "#000000";
        cursorContext.lineWidth = 1;

        // Height is fixed
        let height = this.text.lineLengths.length * this.font.lineHeight;
        // Width is the longest line we've drawn
        let width = 0;
        this.forGlyphInText((glyph, x, y, advanceWidth, row, col, c) => {
            logRender.debug("Drawing", String.fromCodePoint(glyph.codepoint),"at", c);
            // If we have an active selection, draw the box
            if (c >= this.text.selectionStart && c < this.text.selectionEnd) {
                // For the last character in the selection, use glyph.w instead of advance_width
                // so we don't cut it short for glyphs with negative right offset
                const w = c === this.text.selectionEnd - 1 ? glyph.w : advanceWidth;
                selectContext.fillRect(x, y, w, this.font.lineHeight);
            }
            // If the cursor is not currently blinking and should be
            // at this position, draw it (to the left)      
            if(this.text.cursor === c) {
                this.caret = {x, y};
            }
            textContext.drawImage(this.fontTexture, glyph.x, glyph.y, glyph.w, glyph.h, x, y + glyph.top, glyph.w, glyph.h);
            return true;
        }, (x, y, row, col, c) => {
            logRender.debug("Line ended at character", c);
            if(x > width) width = x;
            // If we have an active selection, draw the box
            if (c >= this.text.selectionStart && c < this.text.selectionEnd) {
                // For the last character in the selection, use glyph.w instead of advance_width
                // so we don't cut it short for glyphs with negative right offset
                selectContext.fillRect(x, y, SELECTED_NEWLINE_WIDTH, this.font.lineHeight);
            }
            if(this.text.cursor === c) {
                this.caret = {x, y};
            }
            return true;
        })

        if(this.cursorVisible) {
            cursorContext.setLineDash([]);
            cursorContext.beginPath();
            cursorContext.moveTo(this.caret.x + 1, this.caret.y);
            cursorContext.lineTo(this.caret.x+1, this.caret.y + this.font.lineHeight);
            cursorContext.stroke();
        }
        if(this.insertion !== null) {
            cursorContext.setLineDash([2]);
            cursorContext.beginPath();
            cursorContext.moveTo(this.insertion.x + 1, this.insertion.y);
            cursorContext.lineTo(this.insertion.x + 1, this.insertion.y + this.font.lineHeight);
            cursorContext.stroke();
        }
        // Resize the visible buffer (which will also clear it, even if the numbers don't change)
        this.canvas.width = width + LINE_WIDTH_MARGIN;
        this.canvas.height = height;
        // layer all the buffers together
        context.drawImage(this.selectBuffer, 0, 0);
        context.drawImage(this.textBuffer, 0, 0);
        context.drawImage(this.cursorBuffer, 0, 0);
    }

    public scrollToCursor(this: Ready) {
        // Turn the caret coordinates (which are relative to the canvas)
        // into coordinates relative to the container
        const relX = this.caret.x + this.canvas.offsetLeft;
        const relY = this.caret.y + this.canvas.offsetTop;
        let targetX = this.scrollLeft;
        let targetY = this.scrollTop;
        for(const x of [relX - this.scrollMargin.left, relX + this.scrollMargin.right]) {
            for(const y of [relY - this.scrollMargin.top, relY + this.scrollMargin.bottom]) {
                // Check if this would be visible based on our *current* scroll
                // target, so we don't bother re-doing a scroll if we'd already
                // see what we want
                if(x < targetX) {
                    targetX = x;
                } else if(x >= targetX + this.clientWidth) {
                    targetX = x - this.clientWidth;
                }
                if(y < targetY) {
                    targetY = y;
                } else if(y >= targetY + this.clientHeight) {
                    targetY = y - this.clientHeight;
                }
            }
        }
        if(targetX !== this.scrollLeft || targetY !== this.scrollTop) {
            this.scrollTo(targetX, targetY);
        }
    }
    protected keyBindings: {key: string, shift?: boolean, test?: (ev: KeyboardEvent) => boolean, action: (ev: KeyboardEvent) => void}[] = [
        {key: "c", action: this.clipboardCopy},
        {key: "x", action: this.clipboardCut},
        {key: "v", action: this.clipboardPaste},
        {key: "a", action: this.selectAll},
        {key: "z", shift: false, action: this.undo},
        {key: "z", shift: true, action: this.redo}
    ];
    protected clipboardCopy(this: Ready, ev_: Event) {
        if(this.text.selection.length > 0) {
            navigator.clipboard.writeText(this.text.selection);
            // Doesn't redraw as nothing's changed
        }
    }
    protected clipboardCut(this: Ready, ev_: Event) {
        if(this.text.selection.length > 0) {
            navigator.clipboard.writeText(this.text.selection);
            this.text.delete(CursorDirection.Forward);
            this.postUpdate();
        }
    }
    protected clipboardPaste(this: Ready, ev_: Event ) {
        navigator.clipboard.readText().then((text) => {
            if(text.length > 0) {
                this.text.insert(text, true);
                this.postUpdate();
            }
        });
    }
    protected selectAll(this: Ready, ev: Event) {
        this.text.selectAll();
        this.postUpdate(false, false);
    }
    protected undo(this: Ready, ev_: Event) {
        this.text.undo();
        this.postUpdate();
    }
    protected redo(this: Ready, ev_: Event) {
        this.text.redo();
        this.postUpdate();
    }
    /*
    * Mouse and drag event interactions

    Mousedown
    - If there is a selection *and* the mouse is within it, do nothing (will allow dragstart to run)
    - Otherwise, move the cursor here and set "selecting"

    Mouseup
    - If dragging, do nothing
    - If selecting, move cursor and end selecting
    - Otherwise if shift, move cursor w/ extend
    - Else move cursor w/out extend

    Mousemove
    - If no button down, clear selecting and dragging (just in case)
    - If button down and selecting, extend selection
    - If button down and not selecting, do nothing (will be dragging, handled in dragover)

    Dragstart
    - If no selection, cancel
    - If selecting, do cancel
    - Otherwise, set drag content to selection text
      - And fix the image

    Dragend (fires on source)
    - If dropEffect is move, delete the selected text (otherwise leave it as-is, including selection)
    - Set dragging to false

    Dragenter (fires on target)
    - Prevent default to permit drop operation (probably check we can handle the drag data first)

    Dragover (fires on target)
    - If the source is ourselves *and* the mouse is inside the selection, show no insertion cursor
    - Otherwise, show insertion cursor at the current mouse position

    Drop (fires on target)
    - If there is an insertion point, insert the text at the insertion point
    - Otherwise, cancel the drop (if we're dragging over ourself and didn't leave the selection)


    - Create the drag image by slicing out of the canvas around the selection
    */
    @Handler("mousedown")
    protected mouseDowned(this: Ready, ev: MouseEvent) {
        if(ev.button === 0 && !this.eventWithinSelection(ev)) {
            this.text.setCursor(...this.cursorXYFromEvent(ev), ev.shiftKey);
            this.postUpdate(false);
            this.selecting = true;
        }
    }
    @Handler("mouseup")
    protected mouseUpped(this: Ready, ev: MouseEvent) {
        if(ev.button === 0 && !this.dragging) {
            this.text.setCursor(...this.cursorXYFromEvent(ev), ev.shiftKey || this.selecting);
            this.selecting = false;
            this.postUpdate(false);
        }
    }
    @Handler("mousemove")
    protected mouseMoved(this: Ready, ev: MouseEvent) {
        if(!(ev.buttons & 1)) {
            this.dragging = false;
            this.selecting = false;
        } else if(this.selecting) {
            this.text.setCursor(...this.cursorXYFromEvent(ev), true);
            this.postUpdate(false);
        }
    }
    @Handler("dragstart")
    protected dragStarted(this: Ready, ev: DragEvent) {
        if(this.text.selection.length > 0 && !this.selecting) {
            const dt = ev.dataTransfer;
            if(dt) {
                dt.clearData();
                dt.setData("text/plain", this.text.selection);
                dt.effectAllowed = "copyMove";
                dt.dropEffect = "move";
                // TODO: Set the drag image to the currently selected text (only)
                dt.setDragImage(this.dragImage, 0, 0);
            }
            
            this.dragging = true;
        } else {
            ev.preventDefault();
        }
        
    }
    @Handler("dragend")
    protected dragEnded(this: Ready, ev: DragEvent) {
        if(ev.dataTransfer?.dropEffect === "move" && this.text.selection.length > 0) {
            this.text.delete(CursorDirection.Forward);
        }
        this.dragging = false;
    }

    @Handler("dragenter")
    protected dragEntered(this: Ready, ev: DragEvent) {
        if(ev.dataTransfer?.types.includes("text/plain")) {
            ev.preventDefault();        
        } else {
            console.log("Rejecting drag-over event, can't handle a data transfer with types", ev.dataTransfer?.types);
        }
    }
    @Handler("dragover")
    protected draggedOver(this: Ready, ev: DragEvent) {
        // If we're also dragging then assume we are currently both drag and
        // dragover targets (there's no precise way to ensure this but it seems
        // safe). In which case, only show an insertion cursor if the mouse
        // isn't over the selection (which we're trying to drag)
        if(!this.dragging || !this.eventWithinSelection(ev)) {
            this.insertion = this.coordinateFromEvent(ev, true);
            if(ev.dataTransfer) ev.dataTransfer.dropEffect = ev.ctrlKey ? "copy" : "move";
        } else {
            this.insertion = null;
            if(ev.dataTransfer) ev.dataTransfer.dropEffect = "none";
        }
        this.postUpdate(false);
        ev.preventDefault();
    }
    @Handler("drop")
    protected dropped(this: Ready, ev: DragEvent) {
        // If we dropped on ourself without leaving our own selection,
        // abort to avoid moving
        if(this.dragging && this.eventWithinSelection(ev)) {
            ev.preventDefault();
        } else {
            // If this was a move, and from ourself to ourself, delete the existing
            // text first (as this event fires before dragEnded does)
            if(this.dragging && !ev.ctrlKey) {
                this.text.delete(CursorDirection.Forward, true);
            }
            // Clear the existing selection and move to the insertion point
            this.text.setCursor(...this.cursorXYFromEvent(ev), false);
            const dropData = ev.dataTransfer?.getData("text/plain");
            if(dropData !== undefined) this.text.insert(dropData, true);
            this.insertion = null;
            this.postUpdate(false);
        }
    }
    @Handler("dragleave")
    protected dragLeft(this: Ready, ev: DragEvent) {
        // If the drag-over ended with a drop, insertion will have already been
        // nulled so skip the redraw
        if(this.insertion !== null) {
            this.insertion = null;
            this.postUpdate(false);
        }
    }
    @Handler("slotchange", (that: TextEditor) => that.slotElement, false)
    protected slotChanged(ev: Event) {
        const text = this.slotElement.assignedNodes({flatten: true}).map((node: Node) => node.textContent).join("");
        this.text.reset(text);
        if(this.isReady()) {
            this.postUpdate();
        }
    }

    /**
     * Keydown event handler
     * 
     * Delegates a lot of work out to the functions defined in keyBindings,
     * which is where we define any ctrl+<key> bindings and the like.
     * 
     * It also handles 'special' keys like the arrows, space, enter, delete.
     * 
     * Those could probably be pushed into the keyBindings object to make
     * this function shorter
     * @param ev Keyboard event
     */
    @Handler("keydown")
    protected keyDowned(this: Ready, ev: KeyboardEvent) {
        let preventDefault = true;
        let wasControl = false;
        // Control bindings
        if(ev.ctrlKey) {
            // Handle the problem that key can be upper- or lower-case
            // depending on whether capslock is on and/or we're a ctrl+shift
            // binding 
            const key = ev.key.toLowerCase();
            for(let b of this.keyBindings) {
                if(b.key === key && (b.shift === undefined || b.shift === ev.shiftKey) && (b.test === undefined || b.test(ev))) {
                    b.action.call(this, ev);
                    wasControl = true;
                    break;
                }
            }
        }
        // If it's a typeable character then it will have a single codepoint
        // But not it any control keys are held down
        if([...ev.key].length === 1 && !(ev.altKey || ev.ctrlKey || ev.metaKey || ev.isComposing)) {
            if(ev.key === " " && ev.shiftKey && this.font.glyphMap[0x3000]) {
                this.text.insert(String.fromCodePoint(0x3000));
            } else {
                this.text.insert(ev.key);
            }
            this.postUpdate();
        } else if(!wasControl) {
            switch(ev.key) {
            case "Enter":
            case "Return":
                this.text.insert("\n");
                this.postUpdate();
                break;
            case "Backspace":
            case "Delete":
                this.text.delete(ev.key === "Backspace" ? CursorDirection.Backward : CursorDirection.Forward);
                this.postUpdate();
                break;                
            case "Right":
            case "ArrowRight": {
                this.text.moveCursor(CursorDirection.Forward, ev.ctrlKey ? MoveDistance.Word : MoveDistance.Character, ev.shiftKey);
                this.postUpdate();
                break;
            }
            case "Left":
            case "ArrowLeft": {
                this.text.moveCursor(CursorDirection.Backward, ev.ctrlKey ? MoveDistance.Word : MoveDistance.Character, ev.shiftKey);
                this.postUpdate();
                break;
            }
            // TODO: Ctrl+Up/Down could be scroll instead of move
            case "Up":
            case "ArrowUp": {
                this.text.moveCursor(CursorDirection.Backward, MoveDistance.Line, ev.shiftKey);
                this.postUpdate();
                break;
            }
            case "Down":
            case "ArrowDown": {
                this.text.moveCursor(CursorDirection.Forward, MoveDistance.Line, ev.shiftKey);
                this.postUpdate();
                break;
            }
            case "Home": {
                this.text.moveCursor(CursorDirection.Backward, ev.ctrlKey ? MoveDistance.Document : MoveDistance.LineEnd, ev.shiftKey);
                this.postUpdate();
                break;
            }
            case "End": {
                this.text.moveCursor(CursorDirection.Forward, ev.ctrlKey ? MoveDistance.Document : MoveDistance.LineEnd, ev.shiftKey);
                this.postUpdate();
                break;
            }
            default: {
                // console.log("Unhandled key", ev.key);
                preventDefault = false;
            }
            }
        }
        if(preventDefault) ev.preventDefault();
    }
    /**
     * Call after any changes to the text model to force UI refresh.
     * 
     * Optionally restart the cursor blink timer (ensuring the cursor starts
     * visible) and scroll to bring the cursor into view.
     */
    protected postUpdate(this: Ready, scroll = true, reblink = true): void {
        if(reblink) this.restartBlinking();
        this.redraw();
        if(scroll) {
            this.scrollToCursor();
        }
        const e: Event = new Event("update");
        this.dispatchEvent(e);
    }
    @Handler("focus")
    @Handler("blur")
    focusChanged(this: Ready, e: FocusEvent): void {
        if(e.type === "blur") this.hasFocus = false;
        else {
            this.hasFocus = true;
            this.postUpdate();
        }
    }
    isReady(): this is Ready {
        return this.font !== undefined && this.fontTexture !== undefined;
    }
}
abstract class Ready extends TextEditor {
    protected abstract font: Font;
    protected abstract fontTexture: ImageBitmap;
}
customElements.define('text-editor', TextEditor);
