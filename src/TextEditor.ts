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
    }
`;

enum ScrollBehaviour {
    NONE,
    WITH_MARGIN,
    NO_MARGIN
};

export class TextEditor extends HTMLElement {
    private text = new TextModel();
    private margin = {x: 1, y: 1};
    private scrollMargin = {left: this.margin.x, right: this.margin.x, top: this.margin.y, bottom: this.margin.y};
    private renderWidth: number = this.margin.x * 2;
    private renderHeight: number = this.margin.y * 2;
    private cursorX = this.margin.x;
    private cursorY = this.margin.y;
    // Map of font sizes to their json structures
    public size: FontSize = "12";
    private font: typeof font12 = font12;
    private sprite = new Image();
    private blinkInterval = 500;
    private blink = false;
    private hasFocus = false;
    private intervalRef: ReturnType<typeof setInterval> | null = null;
    private stylesheet: HTMLStyleElement;
    private canvas: HTMLCanvasElement;
    private selectBuffer: HTMLCanvasElement;
    private textBuffer: HTMLCanvasElement;
    private cursorBuffer: HTMLCanvasElement;
    private get canvases() {
        return [this.canvas, this.selectBuffer, this.textBuffer, this.cursorBuffer];
    }
    private get buffers() {
        return [this.selectBuffer, this.textBuffer, this.cursorBuffer];
    }
    
    private eventMap = {
        "load": this.imageLoaded.bind(this),
        "keydown": this.keyDowned.bind(this),
        "mousedown": this.mouseDowned.bind(this),
        "mousemove": this.mouseMoved.bind(this),
        "focus": this.focusChanged.bind(this),
        "blur": this.focusChanged.bind(this),
    }
    constructor() {
        super();
        console.log("TextEditor constructed");
        
        this.attachShadow({mode: "open"});
        this.canvas = document.createElement("canvas");
        this.selectBuffer = document.createElement("canvas");
        this.textBuffer = document.createElement("canvas");
        this.cursorBuffer = document.createElement("canvas");
        this.stylesheet = document.createElement("style");
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
                console.log("New font size", newValue);
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
            this.setAttribute("aria-role", "textarea");
            this.setAttribute("aria-multiline", "true");
            const container = document.createElement("div");
            container.className = "container";
            // Could go back to attaching directly to the shadow root
            container.appendChild(this.stylesheet);
            container.appendChild(this.canvas);

            this.shadowRoot?.appendChild(container);
            this.restartBlinking();
            this.sprite.addEventListener("load", this);
            for(const [event, _] of Object.entries(this.eventMap)) {
                this.addEventListener(event, this);
            }
        }
    }
    public disconnectedCallback() {
        if(this.intervalRef) clearInterval(this.intervalRef);
        this.sprite.removeEventListener("load", this);
        for(const [event, _] of Object.entries(this.eventMap)) {
            this.removeEventListener(event, this);
        }
    }
    public handleEvent(e: Event) : void {
        if(e.target === this && e.type in this.eventMap) {
            this.eventMap[e.type as keyof typeof this.eventMap](e as any);
        } else if(e.target === this.sprite && e.type == "load") {
            this.imageLoaded(e);
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
            left: this.margin.x + this.font.line_height * 2,
            right: this.margin.x + this.font.line_height,
            top: this.margin.y,
            bottom: this.margin.y + this.font.line_height * 2
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
    
    private cursorXYFromPoint(x: number, y: number): [number, number] {
        // Correct for scrolling of the container
        x += this.scrollLeft;
        y += this.scrollTop;
        // assume a 1:1 canvas pixel to HTML document ratio
        // Not sure if this is actually true or how to correct if it isn't
        const cY = Math.floor(Math.max(0, y - this.margin.y) / this.font.line_height);

        if(cY >= this.text.lineLengths.length) {
            return this.text.eofXY();
        }
        const line = this.text.text.split("\n")[cY];
        const lineLength = [...line].length;
        let pixelX = this.margin.x;
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
        return [Math.max(...this.text.lineLengths) * this.font.line_height * 2 + this.margin.x * 2, this.margin.y * 2 + this.text.lineLengths.length * this.font.line_height];
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
        // Current character, determines when we paint a selection
        let c = 0;
        let y = this.margin.y;
        // Height is fixed
        let height = this.margin.y * 2 + this.text.lineLengths.length * this.font.line_height;
        // Width is the longest line we've drawn
        let width = this.margin.x * 2;
        for(const line of this.text.text.split("\n")) {
          let x = this.margin.x;
          let rowWidth = 0;
          this.forEachGlyph(line, (glyph: Glyph, advanceWidth: number) => {
            // If we have an active selection, draw the box
            if (c >= this.text.selectionStart && c < this.text.selectionEnd) {
                // For the last character in the selection, use glyph.w instead of advance_width
                // so we don't cut it short for glyphs with negative right offset
                const w = c === this.text.selectionEnd - 1 ? glyph.w : advanceWidth;
                selectContext.fillRect(x, y, w, this.font.line_height);
            }
            // If the cursor is not currently blinking and should be
            // at this position, draw it (to the left)      
            if(this.text.cursor == c) {
                this.cursorX = x;
                this.cursorY = y;
            }
            textContext.drawImage(this.sprite, glyph.x, glyph.y, glyph.w, glyph.h, x, y + glyph.top, glyph.w, glyph.h);
            // Take the wider of advanceWidth or glyph width when measuring the row
            rowWidth = Math.max(x + advanceWidth, x + glyph.w);
            x += advanceWidth;
            c++;
            return true;
          });
          // If the cursor is at the end of the line, draw it after the last glyph
          if(this.text.cursor == c) {
            this.cursorX = x;
            this.cursorY = y;
          }
          // Increment y coordinate
          y += this.font.line_height;
          // the linebreak is also a character for cursor purposes so increment c
          c++;
          if(rowWidth + this.margin.x * 2 > width) {
            width = this.margin.x * 2 + rowWidth;
          }
        }
        if(this.cursorVisible) {
            cursorContext.beginPath();
            cursorContext.moveTo(this.cursorX+1, this.cursorY);
            cursorContext.lineTo(this.cursorX+1, this.cursorY + this.font.line_height);
            cursorContext.stroke();
        }
        // Resize the visible buffer (which will also clear it, even if the numbers don't change)
        this.canvas.width = width;
        this.canvas.height = height;
        // layer all the buffers together
        context.drawImage(this.selectBuffer, 0, 0);
        context.drawImage(this.textBuffer, 0, 0);
        context.drawImage(this.cursorBuffer, 0, 0);
    }

    public scrollToCursor() {
        // When scrolling, remove the margin again so we actually
        // scroll to 0,0
        let targetX = this.scrollLeft;
        let targetY = this.scrollTop;
        for(const x of [this.cursorX - this.scrollMargin.left, this.cursorX + this.scrollMargin.right]) {
            for(const y of [this.cursorY - this.scrollMargin.top, this.cursorY + this.scrollMargin.bottom]) {
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
    private mouseDowned(ev: MouseEvent) {
        if(ev.button === 0) {
            this.text.setCursor(...this.cursorXYFromPoint(ev.offsetX, ev.offsetY), ev.shiftKey);
            this.postUpdate(false);
        }
    }
    private mouseMoved(ev: MouseEvent) {
        if(ev.buttons & 1) {
            this.text.setCursor(...this.cursorXYFromPoint(ev.offsetX, ev.offsetY), true);
            this.postUpdate(false);
        }
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
                if(b.key === key && (b.shift === undefined || b.shift == ev.shiftKey) && (b.test === undefined || b.test(ev))) {
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
        console.log("Sprite image (re)loaded");
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