import { CanvasHTMLAttributes, DetailedHTMLProps, DOMAttributes } from 'react';
import font12 from './res/axis-12-lobby.json';
import font14 from './res/axis-14-lobby.json';
import font18 from './res/axis-18-lobby.json';
console.log("TextEdit setup ran");
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

enum UndoType {
    INSERT,
    DELETE
}
interface UndoState {
    text: string;
    cursor: number;
    type: UndoType | null;
}
/**
 * Stores undo history as a list of UndoState objects.
 *
 * The history array stores state in ascending age (most recent at 0) and the
 * index cursor points to the current state (that we cared to save).
 *
 * When we're just inserting entries index is 0 and the most recent state is
 * history[0], but as we perform undo operations index increases and points
 * further back in history. If index is > history.length there are no further
 * states we can revert to.
 *
 * Inserting new states when index is > 0 truncates the history array and
 * effectively starts a new timeline from there, so you can no longer use redo()
 * to return to the more recent states.
 *
 * Repeatedly performing actions of the same type (insert or delete) doesn't
 * create new history states; instead it overwrites the previous one. This means
 * when you undo it will undo a batch of single-character insert or deletes at
 * once, rather than doing each keypress individually. This is controlled by the
 * `type` field of an UndoState and the `overwrite` parameter in save() - if
 * overwrite is true *and* the type of the new state matches the most recent
 * undo state then it will overwrite instead of insert.
 * 
 * While this class doesn't make any restrictions about how that logic is applied,
 * the implementation currently behaves as such:
 * - Non-whitespace single-character inserts can overwrite each other
 * - Single-character delete or backspace can overwrite each other
 * - Typing a whitespace character will not overwrite; it starts a new state
 * - Pasting more than one character or deleting a selection starts a new state
 */
class UndoBuffer<T extends {type: any}> {
    /** History of undo states, from most recent to oldest */
    private history: T[];
    /** Position of the last saved state (if there is any). Normally 0,
     * increases as we undo and decreases as we redo */
    private index: number = 0;
    constructor(initialState: T) {
        this.history = [initialState];
    }
    public save(state: T, overwrite: boolean = false) {
        let in_past = false;
        // Discard any post-index history; we can't perform redo now we've written new state
        if(this.index > 0) {
            this.history = this.history.slice(this.index);
            this.index = 0;
            in_past = true;
        }
        if(!in_past && this.history.length > 0 && overwrite && state.type !== null && state.type === this.current?.type) {
            this.history[0] = state;
            console.log("Overwriting previous undo state with ", this.current);
        } else {
            this.history.unshift(state);
            console.log("Inserting new undo state of ", this.current);
        }
    }
    public get current(): T | undefined {
        if(this.index < this.history.length) return this.history[this.index];
        return undefined;
    }
    public undo(): T | undefined {
        if(this.index < this.history.length - 1) {
            this.index++;
            console.log("Undoing to state", this.current," index is now", this.index);
            return this.current;
        }
        return undefined;
    }
    public redo(): T | undefined {
        if(this.index > 0 && this.index < this.history.length) {
            this.index--;
            console.log("Redoing to state", this.current," index is now", this.index);
            return this.current;
        }
        return undefined;
    }
}
export class TextEditor extends HTMLElement {
    private _text: string = "";
    private lineLengths: number[] = [];
    // public src: string = "";
    public width: number = 400;
    public height: number = 400;
    // Map of font sizes to their json structures
    public size: FontSize = "12";
    private font: typeof font12 = font12;
    private _start = 0;
    public get start() {
        return this._start;
    }
    public set start(value) {
        this._start = value;
    }
    private end = 0;
    private forward = true;
    private sprite = new Image();
    private blinkInterval = 500;
    private blink = false;
    private hasFocus = false;
    private intervalRef: ReturnType<typeof setInterval> | null = null;
    private canvas: HTMLCanvasElement;
    private history = new UndoBuffer<UndoState>({text: this.text, cursor: this.cursor, type: null});
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
    public get text(): string {
        return this._text;
    }
    public set text(newValue: string) {
        this._text = newValue;
        this.lineLengths = newValue.split("\n").map(line => [...line].length);
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
        for(const line of this.text.split("\n")) {
          let x = margin.x;
          // When we want to do colour we'll need to mess around with https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing
          for (const cpChar of line) {
            const codepoint = cpChar.codePointAt(0);
            const key = `${codepoint}`;
            var glyph = this.font.glyphs[key as keyof typeof this.font.glyphs] || this.font.default_glyph;
            // TODO: Kerning
            var advance_width = glyph.w + glyph.right;

            // If we have an active selection, draw the box
            if (c >= this.start && c < this.end) {
                // Use glyph.w instead of advance width as we want to wrap the whole sprite
                context.fillRect(x, y, glyph.w, this.font.line_height);
            }
            // If the cursor is not currently blinking and should be
            // at this position, draw it (to the left)      
            if(this.showCursor && this.cursor == c) {
               context.strokeRect(x, y, 0, this.font.line_height);
            }
            context.drawImage(this.sprite, glyph.x, glyph.y, glyph.w, glyph.h, x, y + glyph.top, glyph.w, glyph.h);
            x += advance_width;
            c++;
          }
          // If the cursor is at the end of the line, draw it after the last glyph
          if(this.showCursor && this.cursor == c) {
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
        if(this.selection.length > 0) navigator.clipboard.writeText(this.selection);
    }
    private clipboardCut(ev_: Event) {
        if(this.selection.length > 0) {
            navigator.clipboard.writeText(this.selection);
            this.delete(true);
        }
    }
    private clipboardPaste(ev_: Event ) {
        navigator.clipboard.readText().then((text) => {
            if(text.length > 0) this.insert(text, true);
        });
    }
    private selectAll(ev: Event) {
        this.update(this.text, 0, -1, true);
        // Stop this propogating to do a select-all on the whole page
        ev.preventDefault();
    }
    private undo(ev_: Event) {
        this.restoreState(this.history.undo());
    }
    private redo(ev_: Event) {
        this.restoreState(this.history.redo());
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
            this.insert(ev.key);
        } else {
            switch(ev.key) {
            case "Backspace":
                this.delete(false);
                break;
            case "Delete":
                this.delete(true);
                break;                
            case "Right":
            case "ArrowRight":
                if(ev.shiftKey) this.extendX(true);  
                else this.moveX(true);
                break;
            case "Left":
            case "ArrowLeft":
                if(ev.shiftKey) this.extendX(false);
                else this.moveX(false);
                break;
            default:
                // console.log("Unhandled key", ev.key);
            }
        }
    }
    private imageLoaded(e: Event): void {
        console.log("Sprite image (re)loaded");
        this.redraw()
    }
    focusChanged(e: FocusEvent): void {
        if(e.type === "blur") this.hasFocus = false;
        else this.hasFocus = true;
    }
    private get preSelection(): string {
        return this.text.substring(0, this.start);
    }
    private get postSelection(): string {
        return this.text.substring(this.end);
    }
    private get selection(): string {
        return this.text.substring(this.start, this.end);
    }
    private get cursor(): number {
        return this.forward ? this.end : this.start;
    }
    private restoreState(state: UndoState | undefined) {
        if(state) this.update(state.text, state.cursor, state.cursor, true);
    }
    private update(text: string, start: number, end: number, forward: boolean) {
        this.text = text;
        // Negative start/end mean offsets from end, turn those into offsets from start
        if(start < 0) start = this.text.length - start;
        if(end < 0) end = this.text.length - end;
        if(start > end) {
            this.start = end;
            this.end = start;
        } else {
            this.start = start;
            this.end = end;
        }
        this.forward = forward;
        this.restartBlinking();
        this.redraw();
    }
    insert(text: string, batch = false) {
        text = text.replace(/\r\n/g, "\n");
        this.update(
            this.preSelection + text + this.postSelection,
            this.start + [...text].length,
            this.start + [...text].length,
            true            
        );
        this.history.save({text: this.text, cursor: this.cursor, type: UndoType.INSERT}, !batch && text.trim().length !== 0);
    }
    delete(forward: boolean) {
        let canReplace = true;
        if(this.end > this.start) {
            this.update(this.preSelection + this.postSelection,
                this.start,
                this.start,
                true
                );
            canReplace = false;
        } else if(forward) {
          this.update(this.preSelection + this.postSelection.substring(1), this.start, this.start, true);
        } else {
          let newC = Math.max(0, this.start - 1);
          this.update(this.text.substring(0, newC) + this.postSelection, newC, newC, true);
        }
        this.history.save({text: this.text, cursor: this.cursor, type: UndoType.DELETE}, canReplace);
    }
    moveX(forward: boolean) {
        let newC;
        if(this.start != this.end) {
            newC = forward ? this.end : this.start;
            
        } else {
            newC = this.cursor + (forward ? 1 : -1);
        }
        this.update(this.text, newC, newC, true);
    }
    extendX(forward: boolean) {
        const x = forward ? 1 : -1;
        if(this.forward || this.start == this.end) {
            this.update(this.text, this.start, this.end + x, this.start<=this.end + x);
        } else {
            this.update(this.text, this.start + x, this.end, this.start + x > this.end);
        }
    }    
    
}
customElements.define('text-editor', TextEditor);
