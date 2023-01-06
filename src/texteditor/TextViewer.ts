import { Font, Glyph } from "./Font";
import { Cursor, TextModel, EOL_SELECTION_MARGIN } from "./TextModel";

const EOL_MARGIN = EOL_SELECTION_MARGIN;
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

export default class TextViewer {
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
        private _showWhitespace = false) {
        // TODO: These *could* redraw subsets
        model.addEventListener("change", e => this.redraw());
        model.addEventListener("selectionchange", e => this.redraw());
        this.redraw();
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
    public set showWhitespace(newValue: boolean) {
        this._showWhitespace = newValue;
        this.redraw();
    }
    public get showWhitespace() {
        return this._showWhitespace;
    }
    public setFont(font: Font, fontTexture: ImageBitmap) {
        this.font = font;
        this.fontTexture = fontTexture;
        this.redraw();
    }
    public getThumbnail(): Promise<Blob> {
        const drawto = new HTMLCanvasElement();
        [drawto.width, drawto.height] = [this.textBuffer.width, this.textBuffer.height];
        drawto.getContext("2d")!.drawImage(this.textBuffer.transferToImageBitmap(), 0, 0);
        return new Promise<Blob>((resolve, reject) => drawto.toBlob((blob) => blob !== null ? resolve(blob) : reject));
    }
    //#endregion
    private drawGlyph(context: OffscreenCanvasRenderingContext2D, glyph: Glyph, position: Cursor) {
        context.drawImage(this.fontTexture,
            glyph.x, glyph.y, glyph.w, glyph.h,
            position.x, position.y + glyph.top, glyph.w, glyph.h);
    }

    /**
     * Render the text and whitespace visualisation (if enabled).
     *
     * Both will be drawn to their buffers in monochrome black+alpha, to be
     * recoloured later.
     */
    private renderText() {
        const EOL = this.font.glyphMap[WhitespaceMap[NEWLINE]];
        // Whitespace drawn normally, we'll use source-in later to recolour
        this.whitespaceContext.globalCompositeOperation="source-over";
        // It would be nice to use a custom pseudo-element to style this, but they don't exist yet
        this.whitespaceContext.fillStyle = "rgba(0,0,0,0.25)";
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
    }

    /**
     * Render the current selection (if any) and also text foreground colour.
     *
     * Because the selected text may have a different style the text colour will
     * change based on the selection. Text colouring is done by filling a
     * separate buffer - it will be textStyle.color everywhere except within the
     * selection where it will be selectionStyle.color.
     */
    private renderSelectionAndTextColour() {
        this.textColourContext.globalCompositeOperation="source-over";
        this.textColourContext.fillStyle = this.textStyle.color;
        this.textColourContext.fillRect(0, 0, this.textColourBuffer.width, this.textColourBuffer.height);
        this.textColourContext.fillStyle = this.selectionStyle.color;
        // TODO: Would using .background work instead? Maybe
        this.selectContext.fillStyle = this.selectionStyle.backgroundColor;
        for(const sel of this.model.selections) {
            this.textColourContext.fillRect(sel.x, sel.y, sel.w, sel.h);
            this.selectContext.fillRect(sel.x, sel.y, sel.w, sel.h);
        }

    }

    /**
     * Render the caret and/or insertion cursors if they're current visible
     */
    private renderCursors() {
        // Cursor is drawn in text colour
        this.cursorContext.strokeStyle = this.textStyle.color;
        this.cursorContext.lineWidth = 1;
        if(this._caretVisible) {
            this.cursorContext.setLineDash([]);
            this.cursorContext.beginPath();
            this.cursorContext.moveTo(this.model.caret.x + 1, this.model.caret.y);
            this.cursorContext.lineTo(this.model.caret.x + 1, this.model.caret.y + this.font.lineHeight);
            this.cursorContext.stroke();            
        }
        if(this._insertionCursor !== null) {
            this.cursorContext.setLineDash([2]);
            this.cursorContext.beginPath();
            this.cursorContext.moveTo(this._insertionCursor.x + 1, this._insertionCursor.y);
            this.cursorContext.lineTo(this._insertionCursor.x + 1, this._insertionCursor.y + this.font.lineHeight);
            this.cursorContext.stroke();
        }        
    }
    private redraw() {
        // Setup of contexts
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

        this.renderText();
        this.renderSelectionAndTextColour();
        this.renderCursors();

        // Use the text buffer to mask the text colour buffer. If we do it this
        // way around we can keep textBuffer as a black + white (or black +
        // transparent) version which is then available for thumbnails etc.
        this.textColourContext.globalCompositeOperation="destination-in";
        this.textColourContext.drawImage(this.textBuffer, 0, 0);

        // Layer the buffers onto the output canvas
        this.outputContext.drawImage(this.selectBuffer, 0, 0);
        this.outputContext.drawImage(this.textBuffer, 0, 0);
        
        
        if(this.showWhitespace) {
            // Recolour the black/alpha whitespace buffer in place
            this.whitespaceContext.globalCompositeOperation = "source-in";
            this.whitespaceContext.fillRect(0, 0, this.whitespaceBuffer.width, this.whitespaceBuffer.height);
            this.outputContext.drawImage(this.whitespaceBuffer, 0, 0);
        }

        this.outputContext.drawImage(this.cursorBuffer, 0, 0);
        this.dest.canvas.width = width;
        this.dest.canvas.height = height;
        this.dest.transferFromImageBitmap(this.outputBuffer.transferToImageBitmap());
    }

}