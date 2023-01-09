import { Font, Glyph } from "../texteditor/Font";
import { Controller } from "../texteditor/TextController";
import { BaseTextElement } from "../texteditor/TextEditor";
import { Coord, Cursor, GlyphPosition, TextModel } from "../texteditor/TextModel";
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
    constructor(private element: HTMLGlyphViewerElement, private model: GlyphModel, private viewer: TextView) {}
    handleEvent(ev: Event): void {
        if(ev.type === "mousemove") this.mouseMoved(ev as MouseEvent);
        if(ev.type === "mouseout") this.mousedOut(ev as MouseEvent);
    }
    attach(): void {
        this.element.addEventListener("mousemove", this);
        this.element.addEventListener("mouseout", this);
    }
    detach(): void {
        this.element.removeEventListener("mousemove", this);
        this.element.removeEventListener("mouseout", this);
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
        this._text = newValue.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        this.lines = [];
        // Respect supplied line breaks, but also hard wrap long lines
        for(let line of this._text.split("\n")) {
            while(line.length > this.cols) {
                this.lines.push(line.substring(0, this.cols));
                line = line.substring(this.cols);
            }
            this.lines.push(line);
        }
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
        this.updateSelections();

    }
    public getSelectedGlyph(): Glyph | undefined {
        if(this.anchor && this.anchor.c + 1 === this._caret.c) return this.glyphs[this.anchor.row][this.anchor.col].glyph;
        return undefined;
    }
    public getBoundingBox(): {width: number, height: number} {
        return {
            width: this.cols * this.font.maxWidth,
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

class GlyphView extends TextView {
    protected drawGlyph(context: OffscreenCanvasRenderingContext2D, glyph: Glyph, position: Cursor): void {
        const paddingLeft = Math.floor((this.font.maxWidth - (glyph.w + glyph.right))/2);
        context.drawImage(this.fontTexture,
            glyph.x, glyph.y, glyph.w, glyph.h,
            position.x + paddingLeft, position.y + glyph.top, glyph.w, glyph.h);
    }
    protected renderText() {
        this.whitespaceContext.fillStyle = this.textStyle.getPropertyValue("--glyph-background");
        for(const gp of this.model) {
            if(!gp.glyph) continue;
            const paddingLeft = Math.floor((this.font.maxWidth - (gp.glyph.w + gp.glyph.right))/2);
            this.drawGlyph(this.textContext, gp.glyph, gp);
            this.whitespaceContext.fillRect(gp.x + paddingLeft, gp.y + gp.glyph.top, gp.glyph.w + gp.glyph.right, gp.glyph.h);
        }
    }
    /**
     * Override the default composition as we've stolen the whitespace buffer
     * and repurposed it to render the background of each glyph.
     */
    protected compose() {

        // Use the text buffer to mask the text colour buffer. If we do it this
        // way around we can keep textBuffer as a black + white (or black +
        // transparent) version which is then available for thumbnails etc.
        this.textColourContext.globalCompositeOperation="destination-in";
        this.textColourContext.drawImage(this.textBuffer, 0, 0);

        // Layer the buffers onto the output canvas
        this.outputContext.drawImage(this.selectBuffer, 0, 0);
        this.outputContext.drawImage(this.whitespaceBuffer, 0, 0);
        this.outputContext.drawImage(this.textBuffer, 0, 0);


        this.outputContext.drawImage(this.cursorBuffer, 0, 0);
        this.dest.canvas.width = this.outputBuffer.width;
        this.dest.canvas.height = this.outputBuffer.height;
        this.dest.transferFromImageBitmap(this.outputBuffer.transferToImageBitmap());
    }    
}

export default class HTMLGlyphViewerElement extends BaseTextElement {
    protected model?: GlyphModel;
    protected controller?: GlyphController;
    protected postFontLoad(this: this & {font: Font, fontTexture: ImageBitmap}): void {
          
        if(this.model && this.viewer) {
            this.model.setFont(this.font);
            this.viewer.setFont(this.font, this.fontTexture);
        } else {
            this.model = new GlyphModel(this.font, this._initialValue);
            this.viewer = new GlyphView(this.model, this.font, this.fontTexture, this.context, this.textStyle!, this.selectStyle!, false);
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
    public selectedGlyph(): Glyph | undefined {
        return this.model?.getSelectedGlyph();
    }
}
export function installWebComponent() {
    if(!customElements.get("glyph-viewer")) {
        customElements.define('glyph-viewer', HTMLGlyphViewerElement);
    }
}
installWebComponent();
