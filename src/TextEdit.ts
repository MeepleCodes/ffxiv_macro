import { CanvasHTMLAttributes, DetailedHTMLProps, DOMAttributes } from 'react';

import { CursorDirection, MoveDistance, TextModel } from './TextModel';

import font12 from './res/axis-12-lobby.json';
import font14 from './res/axis-14-lobby.json';
import font18 from './res/axis-18-lobby.json';


type TextEditorElement = Partial<TextEditor & DOMAttributes<TextEditor & { children: any }>>;

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
    
    private eventMap = {
        "load": this.imageLoaded.bind(this),
        "keydown": this.keyDowned.bind(this),
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
    }
    public static get observedAttributes(): string[] {
        return ["size", "width", "height"];
    }
    public attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        switch(name) {
            case "height":
            case "width": {
                this[name] = parseInt(newValue, 10);
                this.canvas.setAttribute(name, newValue);
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
    private get showCursor(): boolean {
        return this.hasFocus && !this.blink;
    }

    private redraw(): void {
        const context = this.canvas.getContext("2d");
        if(!context || !this.sprite.complete) return;
        const margin = {x: 1, y: 1};
        context.clearRect(0, 0, this.width, this.height);
        // console.log("Updating, text is", text, "selection is", selection, "blink is", cursorBlink);
        // TODO: Customise these
        context.fillStyle = "#a0a0ff";
        context.strokeStyle = "#000000";
        // Current character, determines when we paint a selection
        let c = 0;
        let y = margin.y;
        for(const line of this.text.text.split("\n")) {
          let x = margin.x;
          // When we want to do colour we'll need to mess around with https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing
          for (const cpChar of line) {
            const codepoint = cpChar.codePointAt(0);
            const key = `${codepoint}`;
            var glyph = this.font.glyphs[key as keyof typeof this.font.glyphs] || this.font.default_glyph;
            // TODO: Kerning
            var advance_width = glyph.w + glyph.right;

            // If we have an active selection, draw the box
            if (c >= this.text.selectionStart && c < this.text.selectionEnd) {
                // Use glyph.w instead of advance width as we want to wrap the whole sprite
                context.fillRect(x, y, glyph.w, this.font.line_height);
            }
            // If the cursor is not currently blinking and should be
            // at this position, draw it (to the left)      
            if(this.showCursor && this.text.cursor == c) {
               context.strokeRect(x, y, 0, this.font.line_height);
            }
            context.drawImage(this.sprite, glyph.x, glyph.y, glyph.w, glyph.h, x, y + glyph.top, glyph.w, glyph.h);
            x += advance_width;
            c++;
          }
          // If the cursor is at the end of the line, draw it after the last glyph
          if(this.showCursor && this.text.cursor == c) {
            context.strokeRect(x, y, 0, this.font.line_height);
          }
          y += this.font.line_height;
          // the linebreak is also a character for cursor purposes
          c++;
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
    private keyDowned(ev: KeyboardEvent) {
        // Control bindings
        if(ev.ctrlKey) {
            // Handle the problem that key can be upper- or lower-case
            // depending on whether capslock is on and/or we're a ctrl+shift
            // binding 
            const key = ev.key.toLowerCase();
            for(let b of this.keyBindings) {
                if(b.key === key && (b.shift === undefined || b.shift == ev.shiftKey) && (b.test === undefined || b.test(ev))) {
                    b.action(ev);
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
            case "ArrowRight":
            case "Left":
            case "ArrowLeft":
                const direction = ev.key === "Right" || ev.key === "ArrowRight" ? CursorDirection.Forward : CursorDirection.Backward;
                this.text.moveCursor(direction, ev.ctrlKey ? MoveDistance.Word : MoveDistance.Character, ev.shiftKey);
                this.postUpdate();
                break;
            case "Up":
            case "Down":
            case "ArrowUp":
            case "ArrowDown": {
                // TODO: Ctrl+Up/Down should be scroll instead of move
                const direction = ev.key === "Up" || ev.key === "ArrowUp" ? CursorDirection.Backward : CursorDirection.Forward;
                this.text.moveCursor(direction, MoveDistance.Line, ev.shiftKey);
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

    
    // private update(text: string, start: number, end: number, forward: boolean) {
    //     this.text = text;
    //     // Negative start/end mean offsets from end, turn those into offsets from start
    //     if(start < 0) start = this.text.length - start;
    //     if(end < 0) end = this.text.length - end;
    //     if(start > end) {
    //         this.start = end;
    //         this.end = start;
    //     } else {
    //         this.start = start;
    //         this.end = end;
    //     }
    //     this.forward = forward;
    // }
    

}
customElements.define('text-editor', TextEditor);
