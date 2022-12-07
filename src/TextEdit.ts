import { MutableRefObject, DetailedHTMLProps, HTMLAttributes, DOMAttributes, RefAttributes } from 'react';

import { CursorDirection, MoveDistance, TextModel } from './TextModel';
import { Glyph } from './Font';

import font12 from './res/axis-12-lobby.json';
import font14 from './res/axis-14-lobby.json';
import font18 from './res/axis-18-lobby.json';


// type TextEditorElement = Partial<TextEditor & DOMAttributes<TextEditor & { children: any }> & RefAttributes<MutableRefObject<TextEditor>>>;
type TextEditorElement = DetailedHTMLProps<HTMLAttributes<TextEditor> & Partial<TextEditor>, TextEditor>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
        //DetailedHTMLProps<CanvasHTMLAttributes<HTMLCanvasElement>, HTMLCanvasElement> 
      ['text-editor']: TextEditorElement
    }
  }
}
const fontMap = {
    "12": font12,
    "14": font14,
    "18": font18
}
export type FontSize = keyof typeof fontMap;
export const FontSizes: [FontSize] = Object.keys(fontMap) as [FontSize];




export class TextEditor extends HTMLElement {
    private text = new TextModel();
    public width: number = 400;
    public height: number = 400;
    // Map of font sizes to their json structures
    public size: FontSize = "12";
    private font: typeof font12 = font12;
    private sprite = new Image();
    private blinkInterval = 500;
    private blink = false;
    private hasFocus = false;
    private intervalRef: ReturnType<typeof setInterval> | null = null;
    private canvas: HTMLCanvasElement;
    private selectBuffer: HTMLCanvasElement;
    private textBuffer: HTMLCanvasElement;
    private cursorBuffer: HTMLCanvasElement;
    private get canvases() {
        return [this.canvas, this.selectBuffer, this.textBuffer, this.cursorBuffer];
    } 
    
    private eventMap = {
        "load": this.imageLoaded.bind(this),
        "keydown": this.keyDowned.bind(this),
        "click": this.clicked.bind(this),
        "focus": this.focusChanged.bind(this),
        "blur": this.focusChanged.bind(this),
        "copy": console.log,
        "paste": console.log,
        "select": console.log,
        "compositionend": console.log,
        "selectstart": (e: Event) => {
            console.log("Selection started", e);
            console.log("Current selection is", getSelection());
            e.stopPropagation();
            e.preventDefault();
            e.cancelBubble = true;
        },
        "selectionchange": console.log,
    }
    constructor() {
        super();
        console.log("TextEditor constructed");
        
        this.attachShadow({mode: "open"});
        this.canvas = document.createElement("canvas");
        this.selectBuffer = document.createElement("canvas");
        this.textBuffer = document.createElement("canvas");
        this.cursorBuffer = document.createElement("canvas");
    }
    public static get observedAttributes(): string[] {
        return ["size", "width", "height"];
    }
    public attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        switch(name) {
            case "height":
            case "width": {
                this[name] = parseInt(newValue, 10);
                this.canvases.forEach(c => c.setAttribute(name, newValue));
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
    public disconnectedCallback() {
        if(this.intervalRef) clearInterval(this.intervalRef);
        this.sprite.removeEventListener("load", this);
            for(const [event, _] of Object.entries(this.eventMap)) {
                this.removeEventListener(event, this);
            }
    }
    public connectedCallback() {
        if(this.isConnected) {
            this.setAttribute("contenteditable", "");
            this.setAttribute("aria-role", "textarea");
            this.setAttribute("aria-multiline", "true");
            this.shadowRoot?.appendChild(this.canvas);
            this.restartBlinking();
            this.sprite.addEventListener("load", this);
            for(const [event, _] of Object.entries(this.eventMap)) {
                this.addEventListener(event, this);
            }
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
        console.log("Font size set to ", size);
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
    private  margin = {x: 1, y: 1};
    private cursorXYFromPoint(x: number, y: number): [number, number] {
        // assume a 1:1 canvas pixel to HTML document ratio
        // Not sure if this is actually true or how to correct if it isn't
        const cY = Math.floor(Math.max(0, y - this.margin.y) / this.font.line_height);

        if(cY >= this.text.lineLengths.length) {
            return this.text.eofXY();
        }
        const line = this.text.text.split("\n")[cY];
        console.log("Closest line is", cY, line, "trying to find an X in it");
        const lineLength = [...line].length;
        let pixelX = this.margin.x;
        let cX = 0;
        this.forEachGlyph(line, (glyph: Glyph, advanceWidth: number) => {
            if(x <= pixelX + (advanceWidth / 2)) {
                console.log("Clicked in left half of glyph", cY);
                return false;
            } else if(x <= pixelX + advanceWidth) {
                console.log("Clicked in right half of glyph", cY);
                cX++;
                return false;
            }
            cX++;
            pixelX += advanceWidth;
            return true;
        });
        console.log("I think we clicked at", cX, cY);
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
    private redraw(): void {
        const contexts = this.canvases.map(c => c.getContext("2d"));
        const [context, selectContext, textContext, cursorContext] = contexts;
        if(!context || !selectContext || !textContext || !cursorContext || !this.sprite.complete) return;
        
        contexts.forEach(c => c!.clearRect(0, 0, this.width, this.height));
        
        // TODO: Customise these
        selectContext.fillStyle = "#a0a0ff";
        cursorContext.strokeStyle = "#000000";
        // Current character, determines when we paint a selection
        let c = 0;
        let y = this.margin.y;
        
        for(const line of this.text.text.split("\n")) {
          let x = this.margin.x;
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
            if(this.cursorVisible && this.text.cursor == c) {
                cursorContext.strokeRect(x, y, 0, this.font.line_height);
            }
            textContext.drawImage(this.sprite, glyph.x, glyph.y, glyph.w, glyph.h, x, y + glyph.top, glyph.w, glyph.h);
            x += advanceWidth;
            c++;
            return true;
          });
          // If the cursor is at the end of the line, draw it after the last glyph
          if(this.cursorVisible && this.text.cursor == c) {
            cursorContext.strokeRect(x, y, 0, this.font.line_height);
          }
          y += this.font.line_height;
          // the linebreak is also a character for cursor purposes
          c++;
        }      
        // layer all the buffers together
        context.drawImage(this.selectBuffer, 0, 0);
        context.drawImage(this.textBuffer, 0, 0);
        context.drawImage(this.cursorBuffer, 0, 0);  
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
        // Stop this propogating to do a select-all on the whole page
        ev.preventDefault();
        this.postUpdate(false);
    }
    private undo(ev_: Event) {
        this.text.undo();
        this.postUpdate();
    }
    private redo(ev_: Event) {
        this.text.redo();
        this.postUpdate();
    }
    private clicked(ev: MouseEvent) {
        [this.text.cursorX, this.text.cursorY] = this.cursorXYFromPoint(ev.offsetX, ev.offsetY);
    }
    private keyDowned(ev: KeyboardEvent) {
        // Control bindings
        if(ev.ctrlKey) {
            // Handle the problem that key can be upper- or lower-case
            // depending on whether capslock is on and/or we're a ctrl+shift
            // binding 
            const key = ev.key.toLowerCase();
            for(let b of this.keyBindings) {
                if(b.key === key && (b.shift === undefined || b.shift == ev.shiftKey) && (b.test === undefined || b.test(ev))) {
                    b.action.call(this, ev);
                    break;
                }
            }
        }
        // If it's a typeable character then it will have a single codepoint
        if([...ev.key].length === 1) {
            // Skip command bindings (for now) and composition events
            if(ev.altKey || ev.ctrlKey || ev.metaKey || ev.isComposing) return;
            this.text.insert(ev.key);
            this.postUpdate();
        } else {
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


            default:
                // console.log("Unhandled key", ev.key);
            }
        }
    }
    /**
     * Called after each update to the text model.
     * 
     * Optioanlly restart the cursor blink (so the cursor is visible) and do a redraw
     */
    private postUpdate(reblink = true): void {
        if(reblink) this.restartBlinking();
        this.redraw();
    }
    private imageLoaded(e: Event): void {
        console.log("Sprite image (re)loaded");
        this.redraw();
    }
    focusChanged(e: FocusEvent): void {
        if(e.type === "blur") this.hasFocus = false;
        else this.hasFocus = true;
    }

}
customElements.define('text-editor', TextEditor);
