import { Font, Glyph } from "./Font";
import { Position, TextModel, EOL_SELECTION_MARGIN } from "./TextModel";

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

export default class TextView {
    protected outputBuffer = new OffscreenCanvas(0, 0);
    protected outputContext = this.outputBuffer.getContext("2d") as OffscreenCanvasRenderingContext2D;
    protected selectBuffer = new OffscreenCanvas(0, 0);
    protected selectContext = this.selectBuffer.getContext("2d") as OffscreenCanvasRenderingContext2D;
    protected textBuffer = new OffscreenCanvas(0, 0);
    protected textContext = this.textBuffer.getContext("2d") as OffscreenCanvasRenderingContext2D;
    protected whitespaceBuffer = new OffscreenCanvas(0, 0);
    protected whitespaceContext = this.whitespaceBuffer.getContext("2d") as OffscreenCanvasRenderingContext2D;
    protected cursorBuffer = new OffscreenCanvas(0, 0);
    protected cursorContext = this.cursorBuffer.getContext("2d") as OffscreenCanvasRenderingContext2D;
    protected textColourBuffer = new OffscreenCanvas(0, 0)
    protected textColourContext = this.textColourBuffer.getContext("2d") as OffscreenCanvasRenderingContext2D;
    protected _insertionCursor: Position | null = null;
    protected _caretVisible = false;
    
    constructor(
        protected model: TextModel,
        protected font: Font,
        protected fontTexture: ImageBitmap,
        protected dest: ImageBitmapRenderingContext,
        protected textStyle: CSSStyleDeclaration,
        protected selectionStyle: CSSStyleDeclaration,
        protected _showWhitespace = false,
        protected _scale = 1) {
        // TODO: These *could* redraw subsets
        model.addEventListener("change", e => this.redraw());
        model.addEventListener("selectionchange", e => this.redraw(false, true, true));
        this.redraw();
    }
    //#region Public API
    public set caretVisible(newValue: boolean) {
        this._caretVisible = newValue;
        this.redraw(false, false, true);
    }
    public set insertionCursor(newValue: Position|null) {
        this._insertionCursor = newValue;
        this.redraw(false, false, true);
    }
    public set showWhitespace(newValue: boolean) {
        this._showWhitespace = newValue;
        // TODO: We could pull this to its own redraw subset, if we really wanted
        this.redraw();
    }
    public get showWhitespace() {
        return this._showWhitespace;
    }
    public set scale(newValue: number) {
        this._scale = newValue;
        this.redraw();
    }
    public get scale() {
        return this._scale;
    }
    public setFont(font: Font, fontTexture: ImageBitmap) {
        this.font = font;
        this.fontTexture = fontTexture;
        this.redraw();
    }
    public getThumbnail(): Promise<Blob> {
        const drawto = document.createElement("canvas");
        [drawto.width, drawto.height] = [this.textBuffer.width, this.textBuffer.height];
        // Don't use transferTo/FromImageBitmap, even though it seems 'correct',
        // as it wipes the source canvas and we'd have to redraw the text from
        // scratch
        drawto.getContext("2d")?.drawImage(this.textBuffer, 0, 0);
        return new Promise<Blob>((resolve, reject) => drawto.toBlob((blob) => blob !== null ? resolve(blob) : reject));
    }

    //#endregion
    protected drawGlyph(context: OffscreenCanvasRenderingContext2D, glyph: Glyph, position: Position) {
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
    protected renderText() {
        const EOL = this.font.glyphMap[WhitespaceMap[NEWLINE]];
        // Whitespace drawn normally, we'll use source-in later to recolour
        this.whitespaceContext.globalCompositeOperation="source-over";
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
        if(this.showWhitespace) {
            // Recolour the black/alpha whitespace buffer in place
            // TODO: Use a CSS --custom-property for this style
            this.whitespaceContext.fillStyle = this.textStyle.getPropertyValue("--whitespace-color");
            console.log("Using whitespace-color of", this.textStyle.getPropertyValue("--whitespace-color"));

            this.whitespaceContext.globalCompositeOperation = "source-in";
            this.whitespaceContext.fillRect(0, 0, this.whitespaceBuffer.width, this.whitespaceBuffer.height);        
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
    protected renderSelectionAndTextColour(alreadyCleared = false) {
        if(!alreadyCleared) {
            this.textColourContext.clearRect(0, 0, this.textColourBuffer.width, this.textColourBuffer.height);
            this.selectContext.clearRect(0, 0, this.selectBuffer.width, this.selectBuffer.height);
        }
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
        // Use the text buffer to mask the text colour buffer. If we do it this
        // way around we can keep textBuffer as a black + white (or black +
        // transparent) version which is then available for thumbnails etc.
        this.textColourContext.globalCompositeOperation="destination-in";
        this.textColourContext.drawImage(this.textBuffer, 0, 0);
    }

    /**
     * Render the cursor and/or insertion carets if they're current visible
     */
    protected renderCursors(alreadyCleared = false) {
        if(!alreadyCleared) {
            this.cursorContext.clearRect(0, 0, this.cursorBuffer.width, this.cursorBuffer.height);
        }
        // Cursor is drawn in CSS caret-color
        this.cursorContext.strokeStyle = this.textStyle.caretColor;
        this.cursorContext.lineWidth = 1;
        if(this._caretVisible) {
            
            for(const c of this.model.carets) {
                if(c === this.model.cursor) this.cursorContext.setLineDash([]);
                else this.cursorContext.setLineDash([1]);
                this.cursorContext.beginPath();
                this.cursorContext.moveTo(c.x + 0.5, c.y);
                this.cursorContext.lineTo(c.x + 0.5, c.y + this.font.lineHeight);
                this.cursorContext.stroke();            
            }
        }
        if(this._insertionCursor !== null) {
            this.cursorContext.setLineDash([2]);
            this.cursorContext.beginPath();
            this.cursorContext.moveTo(this._insertionCursor.x + 0.5, this._insertionCursor.y);
            this.cursorContext.lineTo(this._insertionCursor.x + 0.5, this._insertionCursor.y + this.font.lineHeight);
            this.cursorContext.stroke();
        }        
    }

    protected getCanvasSize(): {width: number, height: number} {
        let {width, height} = this.model.getBoundingBox();
        if(this.showWhitespace) {
            const EOL = this.font.glyphMap[WhitespaceMap[NEWLINE]];
            width += EOL.w + Math.max(0, EOL.right);
        } else {
            width += EOL_MARGIN;
        }
        return {width, height};
    }

    protected resize(): void {
        const {width, height} = this.getCanvasSize();
        [this.selectBuffer, this.textBuffer, this.whitespaceBuffer, this.cursorBuffer, this.textColourBuffer].forEach(buffer => {
            buffer.width = width;
            buffer.height = height;
        });
        this.outputBuffer.width = width * this.scale;
        this.outputBuffer.height = height * this.scale;
    }
    protected redraw(text = true, selection = true, cursor = true) {
        // Redrawing the text will *always* redraw everything else because a)
        // the position of things might change and b) the canvas is getting
        // resized
        // TODO: Make the booleans make more sense then
        if(text) {
            // Size only changes if the text does
            this.resize();
            this.renderText();
        }
        if(selection || text) this.renderSelectionAndTextColour(text);
        if(cursor || text) this.renderCursors(text);
        this.compose();
    }
    protected compose() {
        // Layer the buffers onto the output canvas
        this.outputContext.imageSmoothingEnabled = false;
        this.outputContext.drawImage(this.selectBuffer, 0, 0, this.outputBuffer.width, this.outputBuffer.height);
        this.outputContext.drawImage(this.textColourBuffer, 0, 0, this.outputBuffer.width, this.outputBuffer.height);
        if(this.showWhitespace) {
            this.outputContext.drawImage(this.whitespaceBuffer, 0, 0, this.outputBuffer.width, this.outputBuffer.height);
        }

        this.outputContext.drawImage(this.cursorBuffer, 0, 0, this.outputBuffer.width, this.outputBuffer.height);
        this.dest.canvas.width = this.outputBuffer.width;
        this.dest.canvas.height = this.outputBuffer.height;
        this.dest.transferFromImageBitmap(this.outputBuffer.transferToImageBitmap());
    }

}