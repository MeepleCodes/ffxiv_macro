import { CursorDirection, MoveDistance, TextModel } from './TextModel';
import { Glyph } from './Font';

import font12 from './res/axis-12-lobby.json';
import font14 from './res/axis-14-lobby.json';
import font18 from './res/axis-18-lobby.json';


const fontMap = {
    "12": font12,
    "14": font14,
    "18": font18
}
export type FontSize = keyof typeof fontMap;
export const FontSizes: [FontSize] = Object.keys(fontMap) as [FontSize];

const STYLESHEET = `
    :host {
        border: 1px solid black;
        cursor: text;
        overflow: auto;
        width: 200px;
        height: 100px;
        padding: 20px;
        position: relative;
    }
    slot {
        display: none;
    }
`;

/*
    private keyBindings: {key: string, shift?: boolean, test?: (ev: KeyboardEvent) => boolean, action: (ev: KeyboardEvent) => void}[] = [
        {key: "c", action: this.clipboardCopy},
        {key: "x", action: this.clipboardCut},
        {key: "v", action: this.clipboardPaste},
        {key: "a", action: this.selectAll},
        {key: "z", shift: false, action: this.undo},
        {key: "z", shift: true, action: this.redo}
    ];

    */
// class KeyBinding {
//     constructor(
//         public key: string,
//         public action: (ev: KeyboardEvent) => void,
//         public shift?: boolean
//     ){}
//     public matches(ev: KeyboardEvent) {
//         return ev.key.toLowerCase() === this.key && (this.shift === undefined || ev.shiftKey === this.shift);
//     }
// }

interface Coordinate {
    x: number;
    y: number;
}

export class TextEditor extends HTMLElement implements EventListenerObject {
    private text = new TextModel();
    // The margin around the cursor to try and keep visible when scrolling
    private scrollMargin = {left: 1, right: 1, top: 1, bottom: 1};
    // Pixel coordinates of the caret/typing cursor, relative to the canvas element
    private caret: Coordinate = {x: 0, y: 0};
    // Pixel coordinates of the drag/drop insertion cursor, or null if we're not
    // currently dropping anything
    private insertion: Coordinate | null = null;
    //Current font size
    public size: FontSize = "12";
    // Actual font structure
    private font: typeof font12 = font12;
    // The image holding the current font's glyph map
    private sprite = new Image();
    // Interval between caret on/off, in ms
    private blinkInterval = 500;
    // Whether the caret is currently blinking (meaning invisible)
    private blink = false;
    // Whether the editor has focus; the caret isn't shown if not
    private hasFocus = false;
    // Reference for the setInterval return used to control the caret blink
    private intervalRef: ReturnType<typeof setInterval> | null = null;

    // A select operation is currently in progress (between mousedown and mouseup)
    private selecting = false;
    // A drag operation (with us as the source) is in progress (between dragstart and dragend)
    private dragging = false;

    // HTMLElements used to build the shadow DOM
    private stylesheet: HTMLStyleElement;
    private canvas: HTMLCanvasElement;
    private slotElement: HTMLSlotElement;

    // Elements not in the DOM that are used for buffers
    private selectBuffer: HTMLCanvasElement;
    private textBuffer: HTMLCanvasElement;
    private cursorBuffer: HTMLCanvasElement;
    private dragImage: HTMLImageElement = new Image();

    // Helpful getters for sets of canvas elements
    private get canvases() {
        return [this.canvas, this.selectBuffer, this.textBuffer, this.cursorBuffer];
    }
    private get buffers() {
        return [this.selectBuffer, this.textBuffer, this.cursorBuffer];
    }
    
    /** Top-level events and their handlers */
    private eventMap = {
        "load": this.imageLoaded.bind(this),
        "keydown": this.keyDowned.bind(this),
        "mouseup": this.mouseUpped.bind(this),
        "mousedown": this.mouseDowned.bind(this),
        "mousemove": this.mouseMoved.bind(this),
        "focus": this.focusChanged.bind(this),
        "blur": this.focusChanged.bind(this),
        "dragstart": this.dragStarted.bind(this),
        "dragend": this.dragEnded.bind(this),
        "dragenter": this.dragEntered.bind(this),
        "dragover": this.draggedOver.bind(this),
        "dragleave": this.dragLeft.bind(this),
        "drop": this.dropped.bind(this)
    }
    constructor() {
        super();
        
        this.attachShadow({mode: "open"});
        // Maybe this should be done with an innerHTML'd template
        // and clone, then pick the nodes out with querySelector()
        this.canvas = document.createElement("canvas");
        this.selectBuffer = document.createElement("canvas");
        // Mark the select buffer's context for frequent reads
        this.selectBuffer.getContext("2d", {willReadFrequently: true});
        this.textBuffer = document.createElement("canvas");
        this.cursorBuffer = document.createElement("canvas");
        this.stylesheet = document.createElement("style");
        this.slotElement = document.createElement("slot");
        this.stylesheet.innerHTML = STYLESHEET;
    }
    public static get observedAttributes(): string[] {
        return ["size", "width", "height"];
    }
    public attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        switch(name) {
            case "height":
            case "width": {
                // this[name] = parseInt(newValue, 10);
                // this.canvases.forEach(c => c.setAttribute(name, newValue));
                break;
            }
            case "size": {
                if (["12", "14", "18"].includes(newValue)) {
                    this.setFont(newValue as FontSize);
                }
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
            
            this.shadowRoot?.appendChild(this.stylesheet);
            this.shadowRoot?.appendChild(this.canvas);
            
            
            this.shadowRoot?.appendChild(this.slotElement);

            this.restartBlinking();
            this.sprite.addEventListener("load", this);
            this.slotElement.addEventListener("slotchange", this);
            for(const [event,] of Object.entries(this.eventMap)) {
                this.addEventListener(event, this);
            }
        }
    }
    public disconnectedCallback() {
        if(this.intervalRef) clearInterval(this.intervalRef);
        this.sprite.removeEventListener("load", this);
        for(const [event, ] of Object.entries(this.eventMap)) {
            this.removeEventListener(event, this);
        }
    }
    public handleEvent(e: Event) : void {
        
        if(e.target === this && e.type in this.eventMap) {
            this.eventMap[e.type as keyof typeof this.eventMap](e as any);
        } else if(e.target === this.sprite && e.type === "load") {
            this.imageLoaded(e);
        } else if(e.type === "slotchange") {
            this.slotChanged(e);
        }
    }
    public insert(text: string) {
        this.text.insert(text);
    }
    private setFont(size: FontSize) {
        this.size = size;
        this.font = fontMap[this.size];
        this.sprite.src = this.font.src;
        this.scrollMargin = {
            left: this.font.line_height * 2,
            right: this.font.line_height,
            top: 0,
            bottom: this.font.line_height * 2
        };
    }
    private restartBlinking() {
        this.blink = false;
        if(this.intervalRef) clearInterval(this.intervalRef);
        this.intervalRef = setInterval(() => {
            this.blink = !this.blink;
            this.redraw();
        }, this.blinkInterval)        
    }
    private get cursorVisible(): boolean {
        return this.hasFocus && !this.blink;
    }
    /**
     * Get the font glyph for a given codepoint, or the default.
     */
    private getGlyph(cpChar: string): Glyph {
        const codepoint = cpChar.codePointAt(0);
        // Font structure is associative so uses codepoint as a string
        const key = `${codepoint}`;
        return this.font.glyphs[key as keyof typeof this.font.glyphs] || this.font.default_glyph;
    }
    
    private coordinateFromEvent(ev: MouseEvent, snap = false): Coordinate {
        // Correct for scrolling, but not padding (as the offsetX/Y already does
        // that for us)
        let offsetLeft = this.canvas.offsetLeft;
        let offsetTop = this.canvas.offsetTop;
        // Normally both canvas and text-editor elements have an offsetParent
        // somewhfere further up the DOM tree, but if someone sets our position
        // to relative then we'll end up being the offsetParent of the canvas
        // and this goes wrong
        if(this.canvas.offsetParent !== this) {
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
            let cY = Math.max(0, Math.floor(y / this.font.line_height))
    
            // If you're just below the last line, pretend you're in the
            // last line. Otherwise, jump to the very last character
            if(cY === this.text.lineLengths.length) {
                cY = this.text.lineLengths.length - 1;
            } else if(cY > this.text.lineLengths.length) {
                cY = this.text.lineLengths.length - 1;
                x = Infinity;
            }
            const line = this.text.text.split("\n")[cY];
            let pixelX = 0;
            this.forEachGlyph(line, (glyph: Glyph, advanceWidth: number) => {
                if(x <= pixelX + (advanceWidth / 2)) {
                    return false;
                } else if(x <= pixelX + advanceWidth) {
                    pixelX += advanceWidth;
                    return false;
                }
                pixelX += advanceWidth;
                return true;
            });
            x = pixelX;
            y = cY * this.font.line_height;
        }

        return {x, y};
    }

    private eventWithinSelection(ev: MouseEvent): boolean {
        // Shortcut: can't be within a selection that doesn't exist
        if(this.text.selection.length === 0) return false;
        let {x, y} = this.coordinateFromEvent(ev);
        let ctx = this.selectBuffer.getContext("2d");
        let data = ctx?.getImageData(x, y, 1, 1).data;
        // If the alpha channel is zero we clicked on an empty bit of
        // the select buffer
        return data !== undefined && data[3] > 0;
    }

    private cursorXYFromEvent(ev: MouseEvent): [number, number] {
        let {x, y} = this.coordinateFromEvent(ev);
        // assume a 1:1 canvas pixel to HTML document ratio
        // Not sure if this is actually true or how to correct if it isn't
        let cY = Math.max(0, Math.floor(y / this.font.line_height))

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
        this.forEachGlyph(line, (glyph: Glyph, advanceWidth: number) => {
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
    private getKerning(leftClass: number, rightClass: number): number | null {
        for(let kernRow of this.font.kerning) {
            if(kernRow.left === leftClass) {
                for(let pair of kernRow.kerning) {
                    if(pair.right === rightClass) {
                        return pair.kern;
                    }
                }
                // If we found the leftClass but no matching rightClass then
                // stop looking (we won't find any more)
                break;
            }
        }
        return null;
    }
    private forEachGlyph(line: string, callback: (glyph: Glyph, advanceWidth: number) => boolean) {
        const glyphs = [...line].map(c => this.getGlyph(c));
        for(const [i, glyph] of glyphs.entries()) {
            let advanceWidth = glyph.w + glyph.right;
            // Look ahead by one to see if we need to apply kerning
            if(i < glyphs.length - 1) {
                const nextGlyph = glyphs[i + 1];
                const kerning = this.getKerning(glyph.kern, nextGlyph.kern);
                if(kerning !== null) advanceWidth += kerning;
            }
            if(callback(glyph, advanceWidth) === false) break;
        }        
    }
    /**
     * Calculate a safe size for a canvas to draw the current text content on
     * 
     * Will be a gross over-estimate but avoids clipping
     */
    private safeSize(): [number, number] {
        return [(Math.max(...this.text.lineLengths) + 1) * this.font.line_height + 10, (this.text.lineLengths.length + 1) * this.font.line_height + 10];
    }
    
    private redraw(): void {
        const contexts = this.canvases.map(c => c.getContext("2d"));
        const [context, selectContext, textContext, cursorContext] = contexts;
        if(!context || !selectContext || !textContext || !cursorContext || !this.sprite.complete) return;
        const drawSize = this.safeSize();
        this.buffers.forEach(b => [b.width, b.height] = drawSize);
        
        
        // TODO: Customise these
        selectContext.fillStyle = "#a0a0ff";
        cursorContext.strokeStyle = "#000000";
        cursorContext.lineWidth = 1;
        // Current character, determines when we paint a selection
        let c = 0;
        let y = 0;
        // Height is fixed
        let height = this.text.lineLengths.length * this.font.line_height;
        // Width is the longest line we've drawn
        let width = 0;
        let x = 0;
        let rowWidth = 0;
        const drawGlyph = (glyph: Glyph, advanceWidth: number) => {
            // If we have an active selection, draw the box
            if (c >= this.text.selectionStart && c < this.text.selectionEnd) {
                // For the last character in the selection, use glyph.w instead of advance_width
                // so we don't cut it short for glyphs with negative right offset
                const w = c === this.text.selectionEnd - 1 ? glyph.w : advanceWidth;
                selectContext.fillRect(x, y, w, this.font.line_height);
            }
            // If the cursor is not currently blinking and should be
            // at this position, draw it (to the left)      
            if(this.text.cursor === c) {
                this.caret = {x, y};
            }
            textContext.drawImage(this.sprite, glyph.x, glyph.y, glyph.w, glyph.h, x, y + glyph.top, glyph.w, glyph.h);
            // Take the wider of advanceWidth or glyph width when measuring the row
            rowWidth = Math.max(x + advanceWidth, x + glyph.w);
            x += advanceWidth;
            c++;
            return true;
        };
        for(const line of this.text.text.split("\n")) {
          x = 0;
          rowWidth = 0;
          this.forEachGlyph(line, drawGlyph);
          // If the cursor is at the end of the line, draw it after the last glyph
          if(this.text.cursor === c) {
            this.caret = {x, y};
          }
          // Increment y coordinate
          y += this.font.line_height;
          // the linebreak is also a character for cursor purposes so increment c
          c++;
          if(rowWidth > width) {
            width = rowWidth;
          }
        }
        if(this.cursorVisible) {
            cursorContext.setLineDash([]);
            cursorContext.beginPath();
            cursorContext.moveTo(this.caret.x + 1, this.caret.y);
            cursorContext.lineTo(this.caret.x+1, this.caret.y + this.font.line_height);
            cursorContext.stroke();
        }
        if(this.insertion !== null) {
            cursorContext.setLineDash([2]);
            cursorContext.beginPath();
            cursorContext.moveTo(this.insertion.x + 1, this.insertion.y);
            cursorContext.lineTo(this.insertion.x + 1, this.insertion.y + this.font.line_height);
            cursorContext.stroke();
        }
        // Resize the visible buffer (which will also clear it, even if the numbers don't change)
        // Add 2 to allow a trailing cursor (which is 1px past the end of the row and 1px wide)
        this.canvas.width = width + 2; 
        this.canvas.height = height;
        // layer all the buffers together
        context.drawImage(this.selectBuffer, 0, 0);
        context.drawImage(this.textBuffer, 0, 0);
        context.drawImage(this.cursorBuffer, 0, 0);
    }

    public scrollToCursor() {
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
    private keyBindings: {key: string, shift?: boolean, test?: (ev: KeyboardEvent) => boolean, action: (ev: KeyboardEvent) => void}[] = [
        {key: "c", action: this.clipboardCopy},
        {key: "x", action: this.clipboardCut},
        {key: "v", action: this.clipboardPaste},
        {key: "a", action: this.selectAll},
        {key: "z", shift: false, action: this.undo},
        {key: "z", shift: true, action: this.redo}
    ];
    private clipboardCopy(ev_: Event) {
        if(this.text.selection.length > 0) {
            navigator.clipboard.writeText(this.text.selection);
            // Doesn't redraw as nothing's changed
        }
    }
    private clipboardCut(ev_: Event) {
        if(this.text.selection.length > 0) {
            navigator.clipboard.writeText(this.text.selection);
            this.text.delete(CursorDirection.Forward);
            this.postUpdate();
        }
    }
    private clipboardPaste(ev_: Event ) {
        navigator.clipboard.readText().then((text) => {
            if(text.length > 0) {
                this.text.insert(text, true);
                this.postUpdate();
            }
        });
    }
    private selectAll(ev: Event) {
        this.text.selectAll();
        this.postUpdate(false, false);
    }
    private undo(ev_: Event) {
        this.text.undo();
        this.postUpdate();
    }
    private redo(ev_: Event) {
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
    private mouseDowned(ev: MouseEvent) {
        if(ev.button === 0 && !this.eventWithinSelection(ev)) {
            this.text.setCursor(...this.cursorXYFromEvent(ev), ev.shiftKey);
            this.postUpdate(false);
            this.selecting = true;
        }
    }
    private mouseUpped(ev: MouseEvent) {
if(ev.button === 0 && !this.dragging) {
            this.text.setCursor(...this.cursorXYFromEvent(ev), ev.shiftKey || this.selecting);
            this.selecting = false;
            this.postUpdate(false);
        }
    }

    private mouseMoved(ev: MouseEvent) {
        if(!(ev.buttons & 1)) {
            this.dragging = false;
            this.selecting = false;
        } else if(this.selecting) {
            this.text.setCursor(...this.cursorXYFromEvent(ev), true);
            this.postUpdate(false);
        }
    }

    private dragStarted(ev: DragEvent) {
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
    
    private dragEnded(ev: DragEvent) {
        if(ev.dataTransfer?.dropEffect === "move" && this.text.selection.length > 0) {
            this.text.delete(CursorDirection.Forward);
        }
        this.dragging = false;
    }

    private dragEntered(ev: DragEvent) {
        if(ev.dataTransfer?.types.includes("text/plain")) {
            ev.preventDefault();        
        } else {
            console.log("Rejecting drag-over event, can't handle a data transfer with types", ev.dataTransfer?.types);
        }
    }
    private draggedOver(ev: DragEvent) {
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
    private dropped(ev: DragEvent) {
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
    private dragLeft(ev: DragEvent) {
        // If the drag-over ended with a drop, insertion will have already been
        // nulled so skip the redraw
        if(this.insertion !== null) {
            this.insertion = null;
            this.postUpdate(false);
        }
    }
    private slotChanged(ev: Event) {
        const text = this.slotElement.assignedNodes({flatten: true}).map((node: Node) => node.textContent).join("");
        this.text.reset(text);
        this.postUpdate();
    }
    private keyDowned(ev: KeyboardEvent) {
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
            this.text.insert(ev.key);
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
    private postUpdate(scroll = true, reblink = true): void {
        if(reblink) this.restartBlinking();
        this.redraw();
        if(scroll) {
            this.scrollToCursor();
        }
    }
    private imageLoaded(e: Event): void {
        this.redraw();
    }
    focusChanged(e: FocusEvent): void {
        if(e.type === "blur") this.hasFocus = false;
        else {
            this.hasFocus = true;
            this.postUpdate();
        }
    }

}
customElements.define('text-editor', TextEditor);