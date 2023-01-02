import { Font, Glyph } from "./Font";
import { Cursor, GlyphPosition, TextModel } from "./TextModel2";

const EOL_MARGIN = 3;
const NEWLINE = 0x0A;
const WhitespaceMap = {
    0x20: 0xB7,
    0xAD: 0x2013,
    0x0A: 0xB6,
    0x3000: 0x301C,
}
function hasWhitespace(codepoint: number): codepoint is keyof typeof WhitespaceMap {
    return codepoint in WhitespaceMap;
}

export class TextViewer {
    private outputBuffer = new OffscreenCanvas(0, 0);
    private outputContext = this.outputBuffer.getContext("2d") as OffscreenCanvasRenderingContext2D;
    private selectBuffer = new OffscreenCanvas(0, 0);
    private selectContext = this.selectBuffer.getContext("2d") as OffscreenCanvasRenderingContext2D;
    private textBuffer = new OffscreenCanvas(0, 0);
    private textContext = this.textBuffer.getContext("2d") as OffscreenCanvasRenderingContext2D;
    private whitespaceBuffer = new OffscreenCanvas(0, 0);
    private whitespaceContext = this.whitespaceBuffer.getContext("2d") as OffscreenCanvasRenderingContext2D;
    private cursorBuffer = new OffscreenCanvas(0, 0);
    private cursorContext = this.cursorBuffer.getContext("2d") as OffscreenCanvasRenderingContext2D;
    private textColourBuffer = new OffscreenCanvas(0, 0)
    private textColourContext = this.textColourBuffer.getContext("2d") as OffscreenCanvasRenderingContext2D;
    private _insertionCursor: Cursor | null = null;
    private _caretVisible = false;
    constructor(
        private model: TextModel,
        private font: Font,
        private fontTexture: ImageBitmap,
        private dest: ImageBitmapRenderingContext,
        private textStyle: CSSStyleDeclaration,
        private selectionStyle: CSSStyleDeclaration,
        private showWhitespace: boolean) {
        // TODO: These *could* redraw subsets
        model.addEventListener("change", e => this.redraw());
        model.addEventListener("selectionchange", e => this.redraw());
    }
    //#region Public API
    public set caretVisible(newValue: boolean) {
        this._caretVisible = newValue;
        this.redraw();
    }
    public set insertionCursor(newValue: Cursor|null) {
        this._insertionCursor = newValue;
        this.redraw();
    }
    
    public setFont(font: Font, fontTexture: ImageBitmap) {
        this.font = font;
        this.fontTexture = fontTexture;
        this.redraw();
    }
    //#endregion
    private drawGlyph(context: OffscreenCanvasRenderingContext2D, glyph: Glyph, position: Cursor) {
        context.drawImage(this.fontTexture,
            glyph.x, glyph.y, glyph.w, glyph.h,
            position.x, position.y + glyph.top, glyph.w, glyph.h);
    }

    private redraw() {
        let {width, height} = this.model.getBoundingBox();
        const EOL = this.font.glyphMap[WhitespaceMap[NEWLINE]];
        if(this.showWhitespace) {
            width += EOL.w + Math.max(0, EOL.right);
        } else {
            width += EOL_MARGIN;
        }
        [this.outputBuffer, this.selectBuffer, this.textBuffer, this.whitespaceBuffer, this.cursorBuffer, this.textColourBuffer].forEach(buffer => {
            buffer.width = width;
            buffer.height = height;
        });
        for(const gp of this.model) {
            if(gp.glyph) {
                this.drawGlyph(this.textContext, gp.glyph, gp);
                if(this.showWhitespace && hasWhitespace(gp.glyph.codepoint)) {
                    const wsGlyph = this.font.glyphMap[WhitespaceMap[gp.glyph.codepoint]];
                    this.drawGlyph(this.whitespaceContext, wsGlyph, gp);
                }
            } else if(this.showWhitespace) {
                this.drawGlyph(this.whitespaceContext, EOL, gp);
            }
        }
        this.textColourContext.fillStyle = this.textStyle.color;
        this.textColourContext.fillRect(0, 0, width, height);
        this.textColourContext.fillStyle = this.selectionStyle.color;
        // TODO: Would using .background work instead? Maybe
        this.selectContext.fillStyle = this.selectionStyle.backgroundColor;
        for(const sel of this.model.selections) {
            this.textColourContext.fillRect(sel.x, sel.y, sel.w, sel.h);
            this.selectContext.fillRect(sel.x, sel.y, sel.w, sel.h);
        }

        this.cursorContext.beginPath();
    }

}