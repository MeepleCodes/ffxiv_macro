import { Font, Glyph } from "../texteditor/Font";
import { Controller } from "../texteditor/TextController";
import { BaseTextElement } from "../texteditor/TextEditor";
import { Coord, GlyphPosition, TextModel } from "../texteditor/TextModel";
import TextView from "../texteditor/TextView";
const STYLESHEET = `
    :host {
        padding: 2px;
        position: relative;
        display: block;
        color: black;
        --glyph-background: rgba(0,0,0,0.1);
    }
    :host:focus {
        outline: none;
    }
    :host::selection {
        background-color: #b0b8e0;
        color: black;
    }
    slot {
        display: none;
    }
    #container {
        position: relative;
        width: 100%;
        height: 100%;
        line-height: 0;
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
class GlyphController implements Controller, EventListenerObject {
    private dragImage = new Image();
    constructor(private element: HTMLGlyphViewerElement, private model: GlyphModel, private viewer: TextView) {}
    handleEvent(ev: Event): void {
        if(ev.type === "mousemove") this.mouseMoved(ev as MouseEvent);
        if(ev.type === "mouseout") this.mousedOut(ev as MouseEvent);
        if(ev.type === "dragstart") this.dragStarted(ev as DragEvent);
    }
    attach(): void {
        this.element.addEventListener("mousemove", this);
        this.element.addEventListener("mouseout", this);
        this.element.addEventListener("dragstart", this);
    }
    detach(): void {
        this.element.removeEventListener("mousemove", this);
        this.element.removeEventListener("mouseout", this);
        this.element.removeEventListener("dragstart", this);
    }
    private mousedOut(ev: MouseEvent) {
        this.model.selectNone();
    }
    private mouseMoved(ev: MouseEvent) {
        const g = this.model.glyphUnderCoord(this.element.coordFromMouseEvent(ev));
        if(g) {
            this.model.selectGlyph(g);
        } else {
            this.model.selectNone();
        }
    }
    protected dragStarted(ev: DragEvent) {
        const selectedText = this.model.getSelectedText();
        console.log("Glyph viewer drag start with", selectedText, this.model.getSelectedGlyph());
        if(selectedText !== null) {
            const dt = ev.dataTransfer;
            if(dt) {
                dt.clearData();
                dt.setData("text/plain", selectedText);
                dt.effectAllowed = "copyMove";
                dt.dropEffect = "move";
                // TODO: Set the drag image to the currently selected text (only)
                dt.setDragImage(this.dragImage, 0, 0);
            }
        } else {
            ev.preventDefault();
        }
        
    }    
}
class GlyphModel extends TextModel {
    constructor(font: Font, value: string, private cols = 16) {
        super(font, value);
        // Our own properties aren't defined until after the super call returns
        // which means the setText call made during the super constructor ran
        // with an undefined 'cols' value. So, run it again, only this time lay
        // out properly. This feels...ugly
        this.reset(value);
    }
    protected setText(newValue: string) {
        // Fix up any newline mess
        newValue = newValue.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        this.lines = [];
        // Respect supplied line breaks, but also hard wrap long lines
        for(let line of newValue.split("\n")) {
            while(line.length > this.cols) {
                this.lines.push(line.substring(0, this.cols));
                line = line.substring(this.cols);
            }
            this.lines.push(line);
        }
        // Use the hardwrapped text as we'll be counting the newlines we inserted
        // for selections[...].c and so forth
        this._text = this.lines.join("\n");
        this.layoutGlyphs();
    }
    protected layoutGlyphs() {
        let x = 0, y = 0, c = 0;
        this.glyphs = this.lines.map((line, row) => {
            x = 0;
            const lineGlyphs = [...line].map(cp => this.font.glyph(cp.codePointAt(0)));
            const lineGlyphPositions: GlyphPosition[] = lineGlyphs.map((glyph, col) => {
                const glyphPosition: GlyphPosition = {
                    glyph,
                    x: x,
                    y,
                    row,
                    col,
                    c
                };
                x += this.font.maxWidth;
                c++;
                return glyphPosition;
            });
            // The trailing 'glyph' position represents the newline
            lineGlyphPositions.push({x, y, row, col: lineGlyphs.length, c});
            c++;
            y += this.font.lineHeight;
            return lineGlyphPositions;
        });

        this.dispatchEvent(new Event("change"));
    }
    public selectGlyph(gp: GlyphPosition) {
        if(this.anchor === gp && this._caret.c === gp.c + 1) return;
        this.anchor = gp;
        this._caret = this.cursorFromC(gp.c + 1);
        console.log("Selecting glyph. Anchor", this.anchor,"caret", this._caret);
        this.updateSelections();
        console.log("Selections now", this.selections);

    }
    public getSelectedText(): string | null {
        const sup = super.getSelectedText();
        console.log("GlyphViewer selected text is", sup, "but my glyph is", String.fromCodePoint(this.getSelectedGlyph()?.codepoint || 0x20), "my selections are", this.selections, "anchor", this.anchor, "caret", this._caret);
        return sup;
    }
    public getSelectedGlyph(): Glyph | undefined {
        if(this.anchor && this.anchor.c + 1 === this._caret.c) return this.glyphs[this.anchor.row][this.anchor.col].glyph;
        return undefined;
    }
    public getBoundingBox(): {width: number, height: number} {
        return {
            width: Math.min(this.cols, this.text.length) * this.font.maxWidth,
            height: this.glyphs.length * this.font.lineHeight
        }
    }
    public glyphUnderCoord(coord: Coord): GlyphPosition | null {
        let row = Math.floor(coord.y / this.font.lineHeight);
        if(row < 0 || row >= this.glyphs.length) {
            return null
        } else {
            // If row is empty, nothing under the cursor
            if(this.glyphs[row].length === 1 || coord.x < 0) {
                return null;
            } else {
                // TODO: This could be a binary chop for efficiency but it probably
                // doesn't matter enough
                for(let i=1; i<this.glyphs[row].length; i++) {
                    const [prev, next] = this.glyphs[row].slice(i-1, i+1);
                    if(prev.x <= coord.x && next.x > coord.x) {
                        return prev;
                    }
                }
            }
        }
        return null;
    }
}
// Augment csstype to add custom property
declare module 'csstype' {
    interface Properties {
      '--glyph-background'?: any;
    }
}
class GlyphView extends TextView {
    protected getCanvasSize(): { width: number; height: number; } {
        return this.model.getBoundingBox();
    }
    /**
     * Overwrite default text rendering to:
     * - Align the glyph in the centre of the column
     * - Draw the glyph's position as a rectangle onto the whitespace buffer
     */
    protected renderText() {
        this.whitespaceContext.fillStyle = this.textStyle.getPropertyValue("--glyph-background");
        for(const gp of this.model) {
            if(!gp.glyph) continue;
            const paddingLeft = Math.floor((this.font.maxWidth - (gp.glyph.w + gp.glyph.right))/2);
            const newPos = {...gp, x: gp.x + paddingLeft};
            this.drawGlyph(this.textContext, gp.glyph, newPos);
            this.whitespaceContext.fillRect(gp.x + paddingLeft, gp.y + gp.glyph.top, gp.glyph.w + gp.glyph.right, gp.glyph.h);
        }
    }
    /**
     * Override the default composition as we've stolen the whitespace buffer
     * and repurposed it to render the background of each glyph.
     */
    protected compose() {

        // Layer the buffers onto the output canvas
        this.outputContext.imageSmoothingEnabled = false;
        this.outputContext.drawImage(this.selectBuffer, 0, 0, this.outputBuffer.width, this.outputBuffer.height);
        this.outputContext.drawImage(this.whitespaceBuffer, 0, 0, this.outputBuffer.width, this.outputBuffer.height);
        this.outputContext.drawImage(this.textColourBuffer, 0, 0, this.outputBuffer.width, this.outputBuffer.height);


        this.outputContext.drawImage(this.cursorBuffer, 0, 0, this.outputBuffer.width, this.outputBuffer.height);
        this.dest.canvas.width = this.outputBuffer.width;
        this.dest.canvas.height = this.outputBuffer.height;
        this.dest.transferFromImageBitmap(this.outputBuffer.transferToImageBitmap());
    }    
}

export default class HTMLGlyphViewerElement extends BaseTextElement {
    protected model?: GlyphModel;
    protected controller?: GlyphController;
    public get canvasElement() {
        return this.canvas;
    }
    protected postFontLoad(this: this & {font: Font, fontTexture: ImageBitmap}): void {
          
        if(this.model && this.viewer) {
            this.model.setFont(this.font);
            this.viewer.setFont(this.font, this.fontTexture);
        } else {
            this.model = new GlyphModel(this.font, this._initialValue);
            this.viewer = new GlyphView(this.model, this.font, this.fontTexture, this.context, this.textStyle!, this.selectStyle!, false, this.scale);
            this.controller = new GlyphController(this, this.model, this.viewer);
            this.controller.attach();
        }
    }
    protected getStyle() {
        return STYLESHEET;
    }    
    public connectedCallback(): void {
        super.connectedCallback();
        if(this.isConnected) {
            this.removeAttribute("contenteditable");
            this.removeAttribute("tab-index",);
            this.removeAttribute("aria-role");
            this.removeAttribute("aria-multiline");
        }
    }
    public glyphAtCursor(ev: {clientX: number, clientY: number}): GlyphPosition | null {
        return this.model?.glyphUnderCoord(this.coordFromMouseEvent(ev)) || null;
    }
    public glyphBoundingBox(gp: GlyphPosition): DOMRect {
        // TODO: If we ever apply global scale, it would need to be applied here
        const {x, y} = this.clientXYFromCoord(gp);
        let w, h;
        if(gp.glyph === undefined) {
            w = 0; h = 0;
        } else {
            w = gp.glyph.w;
            h = this.font?.lineHeight || 0;
        }
        return new DOMRect(x, y, w, h);
    }
}
export function installWebComponent() {
    if(!customElements.get("glyph-viewer")) {
        customElements.define('glyph-viewer', HTMLGlyphViewerElement);
    }
}
installWebComponent();
