import { Font } from "../texteditor/Font";
import { Controller } from "../texteditor/TextController";
import { BaseTextElement } from "../texteditor/TextEditor";
import { Coord, Cursor, GlyphPosition, TextModel } from "../texteditor/TextModel";
import TextViewer from "../texteditor/TextViewer";
const STYLESHEET = `
    :host {
        padding: 2px;
        position: relative;
        display: block;
        color: black;
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
    constructor(private element: HTMLGlyphViewerElement, private model: GlyphModel, private viewer: TextViewer) {}
    handleEvent(ev: Event): void {
        if(ev.type === "mousemove") this.mouseMoved(ev as MouseEvent);
    }
    attach(): void {
        this.element.addEventListener("mousemove", this);
    }
    detach(): void {
        this.element.removeEventListener("mousemove", this);
    }

    private mouseMoved(ev: MouseEvent) {

    }

}
class GlyphModel extends TextModel {
    private cols = 16;
    constructor(private canvas: HTMLCanvasElement, font: Font, value: string) {
        super(font, value);
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
        console.log("Wrapping", newValue, " complete, laying out", this.lines);
        this.layoutGlyphs();
    }
    protected layoutGlyphs() {
        let x = 0, y = 0, c = 0;
        this.glyphs = this.lines.map((line, row) => {
            x = 0;
            const lineGlyphs = [...line].map(cp => this.font.glyph(cp.codePointAt(0)));
            const lineGlyphPositions: GlyphPosition[] = lineGlyphs.map((glyph, col) => {
                const paddingLeft = Math.floor((this.font.maxWidth - (glyph.w + glyph.right))/2);
                const glyphPosition: GlyphPosition = {
                    glyph,
                    x: x + paddingLeft,
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
    public getBoundingBox(): {width: number, height: number} {
        return {
            width: this.cols * this.font.maxWidth,
            height: this.glyphs.length * this.font.lineHeight
        }
    }
    public glyphUnderCoord(coord: Coord): GlyphPosition | null {

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
            this.model = new GlyphModel(this.canvas, this.font, this._initialValue);
            this.viewer = new TextViewer(this.model, this.font, this.fontTexture, this.context, this.textStyle!, this.selectStyle!, false);
            this.controller = new GlyphController(this, this.model, this.viewer);
            this.controller.attach();
        }
    }
    protected getStyle() {
        return STYLESHEET;
    }    
}
export function installWebComponent() {
    if(!customElements.get("glyph-viewer")) {
        customElements.define('glyph-viewer', HTMLGlyphViewerElement);
    }
}
installWebComponent();
