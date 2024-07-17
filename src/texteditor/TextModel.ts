import { Font, Glyph } from './Font';
import { UndoBuffer } from './UndoBuffer';
import log from 'loglevel';
const logger = log.getLogger("TextModel");


export const EOL_SELECTION_MARGIN = 3;
/**
 * A screen-space coordinate.
 * 
 * 0,0 is at the top-left of the screen; x increases towards the right and y
 * increases downward.
 */
export type Coord = {
    readonly y: number,
    readonly x: number
}
/**
 * The position of a glyph within the rendered document.
 *
 * It has both a location within the document (row, col, c) and on the screen
 * (x, y).
 *
 * Positions can normally only reflect where a glyph actually exists in the
 * document, but if a position is derived from a screen location that doesn't
 * map exactly to the location of a glyph (either because it sits mid-glyph, or
 * outside the bounds of a row) then `virtualX` will be set to the true screen X
 * location. This is used for column selection and mouse input.
 */
export type Position = Coord & {
    readonly virtualX?: number;
    readonly row: number;
    readonly col: number;
    readonly c: number;
}
/**
 * A glyph in a document with its accompanying position data
 */
export type GlyphPosition = Position & {
    glyph?: Glyph;
}

const DEFAULT_CURSOR_POSITION: Position = {x: 0, y: 0, row: 0, col: 0, c: 0};
/**
 * A rectangular block of selected characters on one row. The complete selection
 * can contain multiple of these, even in normal selection mode (if the
 * selection spans multiple lines).
 */
export interface SelectionPart {
    /** Pixel coordinate of the left end */
    x: number;
    /** Pixel coordinate of the top */
    y: number;
    /** Pixel width */
    w: number;
    /** Pixel height (same as the font's row height) */
    h: number;
    /** The character index of the left end of the selection */
    c: number;
    /** The number of glyphs selected */
    length: number;
    /** The actual text selected */
    text: string;
}

/**
 * Enum of forward/backward in text, used for moving cursors/selections and
 * deleting. Forward is always towards the beginning of the document but may
 * mean "up" or "left".
 */
export enum TextDirection {
    Forward,
    Backward
}
/**
 * Distances to move a cursor
 */
export enum MoveDistance {
    // One character left or right
    Character,
    // One word left or right
    Word,
    // To the start or end of the current line
    LineEnd,
    // Up or down one line
    Line,
    // To the start or end of the text
    Document
}
enum UndoType {
    INSERT,
    DELETE
}
type TextState = {
    text: string;
    caret: Position;
    type: UndoType | null;
}
export class TextModel extends EventTarget {
    protected lines = [""];
    protected _text = "";
    /** Glyphs and cursors for every line plus an extra 'glyph' position at the end of each line with a null glyph and the location where the line ends */
    protected glyphs: GlyphPosition[][] = [[DEFAULT_CURSOR_POSITION]];
    /** Position of the 'main' (only in non-column mode) caret which defines one end of the selection box or strip. Outside of selection mode, the insertion point. */
    protected _cursor = DEFAULT_CURSOR_POSITION;
    /** All carets we render and/or insert text at. Outside of column mode, this is just cursor above. In column mode, there is one caret per row in the selection. */
    protected _carets: Position[] = [DEFAULT_CURSOR_POSITION];
    /** The origin of the current selection (or null outside of select mode). This is where the cursor was when selecting started; the other end of the selection is defined by `cursor`. */
    protected anchor: Position|null = null;
    /** The individual parts that make up the current select; empty if there's none */
    private selectionParts: SelectionPart[] = [];
    private history: UndoBuffer<TextState> = new UndoBuffer<TextState>(this.getState());

    constructor(protected font: Font, initialValue: string = "") {
        super();
        this.reset(initialValue);
    }

    public setFont(newValue: Font) {
        this.font = newValue;
        this.layoutGlyphs();
    }
    public reset(text: string) {
        this.setText(text);
        this.selectNone();
        this.history.reset(this.getState());
    }
    protected setText(newValue: string) {
        // Fix up any newline mess
        this._text = newValue.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        this.lines = this._text.split("\n");
        this.layoutGlyphs();
    }
    public get text() {
        return this._text;
    }
    
    public get cursor() {
        return this._cursor;
    }
    protected set cursor(value: Position) {
        this._cursor = value;
    }
    public get carets() {
        return this._carets;
    }
    protected set carets(value: Position[]) {
        this._carets = value;
    }
    public get selections() {
        return [...this.selectionParts];
    }
    public getSelectionLength(): number {
        return this.selections.reduce((v, s) => v + s.length, 0);
    }
    /**
     * Get the 'width' of the selection, if that is meaningful to do so.
     *
     * Width is only calculated for column-mode selections or normal selections
     * that don't span multiple lines. Otherwise, or if there is no selection,
     * we return undefined.
     *
     * @returns The width, if meaningful, otherwise undefined
     */
    public getSelectionWidth(): number | undefined {
        if(this.anchor === null || (this.anchor.y !== this.cursor.y && !this.columnSelection())) return undefined;
        return Math.abs(this.cursor.x - this.anchor.x);
    }
    public getSelectedText(): string|null {
        if(this.anchor === null) return null;
        return this.selections.reduce<string|null>((v, s) => v === null ? s.text : `${v}\n${s.text}`, null);
    }
    public isInSelection(coord: Coord) {
        return this.selections.some(s => s.x <= coord.x && s.x + s.w >= coord.x && s.y <= coord.y && s.y + s.h >= coord.y);
    }
    public hasSelection() {
        return this.getSelectionLength() > 0;
    }
    public columnSelection() {
        return this.carets.length > 1;
    }
    [Symbol.iterator]() {
        return this.glyphs.flat(1)[Symbol.iterator]();
    }
    /**
     * Calculate a bounding box for the current text.
     *
     * The width will be the greater of advance width or glyph width on the
     * widest line, but won't make any allowance for a cursor or whitespace
     * visualisation at the end of the line.
     *
     * @returns The bounding box as an object with width and height properties
     */
    public getBoundingBox(): {width: number, height: number} {
        return {
            width: Math.max(...this.glyphs.map(line => line.at(-1)!.x)),
            height: this.glyphs.length * this.font.lineHeight
        }
    }
    public selectAll() {
        this.anchor = DEFAULT_CURSOR_POSITION;
        this.setCursor(this.cursorAtEOF(), true);
    }
    public selectNone() {
        if(this.anchor === null && this.cursor === DEFAULT_CURSOR_POSITION) return;
        this.anchor = null;
        this.setCursor(DEFAULT_CURSOR_POSITION);
    }
    public setCaretToCoord(coord: Coord, extendSelection = false, columnMode = false) {
        const cursor = this.cursorFromCoord(coord);
        logger.debug("Setting caret to", cursor, "from", coord);
        this.setCursor(cursor, extendSelection, columnMode);
    }
    public setCaretToC(c: number, extendSelection = false, columnMode = false) {
        const cursor = this.cursorFromC(c);
        this.setCursor(cursor, extendSelection, columnMode);
    }
    public moveCaret(direction: TextDirection, distance: MoveDistance, extendSelection = false) {
        const moveFrom: Position = (!extendSelection && this.anchor !== null) ? (
            direction === TextDirection.Backward ? this.selectionStart : this.selectionEnd
        ) : this.cursor;
        let newCursor: Position|null = null;
        switch(distance) {
            case MoveDistance.Character: {
                const mod = direction === TextDirection.Forward ? +1 : -1;
                newCursor = this.cursorFromC(moveFrom.c + mod);
                break;
            }
            case MoveDistance.Line: {
                const mod = (direction === TextDirection.Forward ? +1 : -1) * this.font.lineHeight;
                newCursor = this.cursorFromCoord({x: moveFrom.x, y: moveFrom.y + mod}, true);
                break;
            }
            case MoveDistance.LineEnd: {
                if(direction === TextDirection.Forward) {
                    newCursor = this.cursorFromRowCol(moveFrom.row, this.glyphs[moveFrom.row].length)
                } else {
                    newCursor = this.cursorFromRowCol(moveFrom.row, 0);
                }
                break;
            }
            case MoveDistance.Word: {
                // Move in the direction of travel until we have passed
                // at least one non-whitespace, then stop at the next
                // whitespace
                const from = moveFrom.c;
                // Cursor is expressed as codepoints, *not* characters, so do
                // this The reversing is still not *perfect* (it might fuck up
                // combined characters for accents etc) but for what we need it
                // should be ok
                const scanCPs = direction === TextDirection.Forward ? 
                    [...this._text].slice(from).join("") :
                    [...this._text].slice(0, from).reverse().join("");
                
                const offset = scanCPs.search(/(?<=\S)\s/);
                if(direction === TextDirection.Forward) {
                    if(offset === -1) newCursor = this.cursorAtEOF();
                    else newCursor = this.cursorFromC(from + offset);
                } else {
                    if(offset === -1) newCursor = {...DEFAULT_CURSOR_POSITION};
                    else newCursor = this.cursorFromC(from - offset);
                }
                break;
            }
            case MoveDistance.Document: {
                if(direction === TextDirection.Forward) {
                    newCursor = this.cursorAtEOF();
                } else {
                    newCursor = {...DEFAULT_CURSOR_POSITION};
                }
            }
            
        }
        this.setCursor(newCursor, extendSelection);
    }
    /**
     * Delete all selected text, calling setText() with what remains.
     * 
     * If there are multiple cursors (and therefor multiple discrete selections),
     * they are assumed to be non-overlapping and in order.
     */
    private sliceSelection(text: string = "") {
        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        if(!this.hasSelection() && text === "") {
            // No selection, no replacement text - actually a no-op
        } else if(!this.columnSelection()) {
            // Either a selection, or some insertion text, but not column mode
            // The cursor will be just after the inserted text; there will be no anchor
            const newC = this.selectionStart.c + text.length;
            // Use start/end of selection rather than the individual selection
            // rectangles as we know they are contiguous
            this.setText(this.text.substring(0, this.selectionStart.c) + text + this.text.substring(this.selectionEnd.c));
            this.setCursor(this.cursorFromC(newC));
        } else {
            // Column mode, so we are (possibly) slicing discontinuous sections
            // out and/or inserting in multiple places

            // Work out what we're inserting, if we're inserting anything
            const textLines = text.split("\n");
            let insertions;
            // If the insert is one line (which includes "", ie insert nothing)
            // then we insert the same thing at every caret            
            if(textLines.length === 1) {
                insertions = new Array(this.carets.length).fill(text);
            } else {
                insertions = this.carets.map((c_, i) => i >= textLines.length ? "" : textLines[i]);
            }
            // Accumulated new text
            let newText = "";
            // End of the last selection we removed; include from here to start
            // of next selection (or EOF) in newText.
            let lastEnd = 0;
            for(const [i, s] of this.selections.entries()) {
                newText += this.text.substring(lastEnd, s.c) + insertions[i];
                lastEnd = s.c + s.length;
            }
            // The cursor will be at the end of the last splice location
            const newCursorC = newText.length;
            // The anchor will be at the end of the first insertion
            const newAnchorY = this.selections[0].y;
            newText += this.text.substring(lastEnd);
            
            this.setText(newText);
            // Now we've replaced the text, get a new caret position
            const newCursor = this.cursorFromC(newCursorC);
            // Using *that*, place the anchor at the same X coordinate on its original row
            this.anchor = this.cursorFromCoord({x: newCursor.x, y: newAnchorY});
            this.setCursor(newCursor, true, true);
        }
        
        
    }

    public insert(text: string, batch = false) {
        // FIXME: Basic insert now broken!
        this.sliceSelection(text);
        this.history.save(this.getState(UndoType.INSERT), !batch && text.trim().length !== 0); 
    }
    /**
     * Delete the active selection if there is one, otherwise a single character.
     * 
     * bypassUndo is only used by the drag/drop operation when we drop text onto ourselves,
     * where we don't want to have an intermediate undo state between deleting the text in
     * its old location and placing it in the new.
     * 
     * @param direction Which direction to delete if there is no active selection
     * @param bypassUndo If true, do not create an undo state
     */
    public delete(direction: TextDirection = TextDirection.Forward, bypassUndo = false) {
        let canReplace = true;
        logger.debug("Delete requested. hasSelection:", this.hasSelection(), "")
        if(this.hasSelection()) {
            this.sliceSelection();
            canReplace = false;
        } else if(!this.columnSelection()) {
            if(direction === TextDirection.Forward) {
                this.setText(this.getPreSelection() + this.getPostSelection().substring(1));
                // Force a new cursor value even though it's not changed to recalculate selections
                this.setCursor(this.cursor);
            } else {
                const newC = Math.max(0, this.cursor.c - 1);
                this.setText(this.getPreSelection().substring(0, newC) + this.getPostSelection());
                this.setCursor(this.cursorFromC(newC));

            }
            // Clear the selection
            this.anchor = null;            
        } else {
            // Complex case: take chunks before and after each selection
            let newText = "";
            let lastEnd = 0;
            let newAnchor = null;
            logger.debug("Performing complicated delete");
            for(const c of this.carets) {
                let sliceTo, sliceFrom;
                logger.debug("Considering caret", c);
                if(direction === TextDirection.Forward) {
                    sliceTo = c.c;
                    
                    // Can't delete forward past the end of the line, so no-op
                    sliceFrom = c.col === this.glyphs[c.row].length-1 ? c.c : c.c + 1;
                    logger.debug("Deleting forward, added text up to", sliceTo, "next section starts at ", sliceFrom);
                } else {
                    sliceFrom = c.c;
                    // Likewise, can't backspace past the start of a line, so no-op
                    sliceTo = c.col === 0 ? c.c : c.c - 1;
                    logger.debug("Deleting backward, added text up to", sliceTo, "next section starts at ", sliceFrom);
                }
                if(newAnchor === null) {
                    logger.debug("No anchor yet, will use", sliceTo);
                    newAnchor = sliceTo;
                }
                newText += this.text.substring(lastEnd, sliceTo);
                lastEnd = sliceFrom;
            }
            // The cursor will be at the end of the last splice location
            const newC = newText.length;
            newText += this.text.substring(lastEnd);
            this.setText(newText);
            this.anchor = this.cursorFromC(newAnchor || 0);
            this.setCursor(this.cursorFromC(newC), true, true);
        }

        if(!bypassUndo) this.history.save(this.getState(UndoType.DELETE), canReplace);
    }

    public undo() {
        this.restoreState(this.history.undo());
    }
    public redo() {
        this.restoreState(this.history.redo());
    }
    private getPreSelection() {
        return [...this.text].slice(0, this.selectionStart.c).join("");
    }

    private getPostSelection() {
        return [...this.text].slice(this.selectionEnd.c).join("");
    }


    /**
     * 
     */
    protected layoutGlyphs() {
        let x = 0, y = 0, c = 0;
        this.glyphs = this.lines.map((line, row) => {
            x = 0;
            const lineGlyphs = [...line].map(cp => this.font.glyph(cp.codePointAt(0)));
            const lineGlyphPositions: GlyphPosition[] = lineGlyphs.map((glyph, col) => {
                const glyphPosition: GlyphPosition = {
                    glyph,
                    x,
                    y,
                    row,
                    col,
                    c
                };
                let advanceWidth = glyph.w + glyph.right;
                // Look ahead by one to see if we need to apply kerning
                if(col < lineGlyphs.length - 1) {
                    const nextGlyph = lineGlyphs[col + 1];
                    const kerning = this.font.getKerning(glyph, nextGlyph);
                    advanceWidth += kerning;
                }
                x += advanceWidth;                
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
    /**
     * The cursor position at the start (left/topmost end) of the current selection.
     * 
     * Returns whichever of anchor and caret are closer to the start of the document.
     */
    private get selectionStart(): Position {
        return this.anchor === null ? this.cursor : (
            this.anchor.c > this.cursor.c ? this.cursor : this.anchor
        );
    }
    /**
     * The cursor position at the end (right/bottom most) of the current selection
     * 
     * Returns whichever of anchor and caret are closer to the end of the document.
     */
    private get selectionEnd(): Position {
        return this.anchor === null ? this.cursor : (
            this.anchor.c > this.cursor.c ? this.anchor : this.cursor
        );
    }
    protected updateSelections(columnMode = false) {
        console.debug("Updating selections - calculating from anchor", this.anchor, "to cursor", this.cursor);
        this.selectionParts = [];
        if(!columnMode) {
            // In normal select mode there's a single caret
            this.carets = [this.cursor];
            // Because we already set the caret, we can just iterate the
            // selection parts from top to bottom as we don't need to know which
            // end of it to draw the caret on
            if(this.anchor !== null) {
                for(let row = this.selectionStart.row; row<=this.selectionEnd.row; row++) {
                    // Cursor position of the start of the selection on this row
                    // On the first row of the selection it's the selection start point,
                    // on all subsequent rows it's the start of that row
                    const rowStart = row === this.selectionStart.row ? 
                        this.selectionStart :
                        this.glyphs[row][0];
                    // End of the selection on this row - inverse logic to start
                    const rowEnd = row === this.selectionEnd.row ?
                        this.selectionEnd :
                        this.glyphs[row].at(-1)!;

                    let w = rowEnd.x - rowStart.x;
                    // When the selection wraps over a line, we include a few
                    // extra characters to show the newline is selected too
                    if(rowEnd.col === this.glyphs[row].length - 1 && rowEnd !== this.selectionEnd) w += EOL_SELECTION_MARGIN;
                    this.selectionParts.push({
                        x: rowStart.x,
                        y: this.font.lineHeight * row,
                        w, 
                        h: this.font.lineHeight,
                        c: rowStart.c,
                        length: rowEnd.c - rowStart.c,
                        text: this._text.slice(rowStart.c, rowEnd.c)
                    });
                }
            }

        } else if(this.anchor === null) {
            // Column mode with no selection, just set the one caret and done
            // Shouldn't really happen but no sense breaking if it does
            this.carets = [this.cursor];
        } else {
            this.carets = [];
            // Get the horizontal bounds of the selection box, which is
            // independent of where anchor and cursor sit in the document order
            const [xMin, xMax, caretAtEnd] = this.cursor.x >= this.anchor.x ?
                [this.anchor.x, this.cursor.x, true] :
                [this.cursor.x, this.anchor.x, false];
            for(let row = this.selectionStart.row; row <= this.selectionEnd.row; row++) {
                const y = this.font.lineHeight * row;
                // Cursor position of the leftmost end of the selection on this row
                const rowStart = this.cursorFromCoord({x: xMin, y});
                // Cursor position of the rightmost end of the selection on this row
                const rowEnd = this.cursorFromCoord({x: xMax, y});
                
                this.selectionParts.push({
                    x: rowStart.x,
                    y: y,
                    w: rowEnd.x - rowStart.x,
                    h: this.font.lineHeight,
                    c: rowStart.c,
                    length: rowEnd.c - rowStart.c,
                    text: this._text.slice(rowStart.c, rowEnd.c)
                });
                // Make sure if we're on the cursor row we push the actual cursor object, so it
                // matches with === elsewhere
                if(row === this.cursor.row) {
                    this.carets.push(this.cursor);
                    console.log("Pushing cursor onto carets list because we're on row", row);
                // Otherwise, put a caret at the right end of the row
                } else {
                    this.carets.push(caretAtEnd ? rowEnd : rowStart);
                }
            }

        }
        this.dispatchEvent(new Event("selectionchange"));
    }
    private cFromRowCol(row: number, col: number): number {
        return this.glyphs.slice(0, row).reduce((total, line) => total + line.length, col);
    }
    /**
     * Get the Cursor value closest to the supplied top/left coordinate
     * @param coord X/Y coordinate
     * @param extendX Whether to save an X value that exceeds line width in virtualX
     * @returns 
     */
    public cursorFromCoord(coord: Coord, extendX = false): Position {
        let row = Math.floor(coord.y / this.font.lineHeight);
        let col = 0;
        // If you click below everything, snap to the end of the last line
        if(row < 0) {
            row = 0;
            col = 0;
        } else if(row > this.glyphs.length) {
            row = this.glyphs.length -1;
            col = this.glyphs.at(-1)!.length - 1;
        } else {
            // If you click just below the last line, treat it as if
            // it was in the last line (don't jump right to the end)
            if(row === this.glyphs.length && this.glyphs.length > 0) {
                row = this.glyphs.length - 1;
            }
            // If this line is empty or left is negative, col is 0
            if(this.glyphs[row].length === 1 || coord.x < 0) {
                col = 0;
            } else {
                
                // Set a default of "far end of line" in case we reach the end
                // of the loop without finding a match
                col = this.glyphs[row].length - 1;
                // TODO: This could be a binary chop for efficiency but it probably
                // doesn't matter enough
                for(let i=1; i<this.glyphs[row].length; i++) {
                    const [prev, next] = this.glyphs[row].slice(i-1, i+1);
                    if(prev.x <= coord.x && next.x > coord.x) {
                        if(Math.abs(prev.x - coord.x) < Math.abs(next.x - coord.x)) col = i-1;
                        else col = i;
                        break;
                    }
                }
            }
        }
        const g = this.glyphs[row][col];
        return {
            row,
            col,
            x: g.x,
            y: g.y,
            c: this.cFromRowCol(row, col),
            virtualX: extendX ? coord.x : g.x
        };
    }
    private cursorAtEOF(): Position {
        return this.glyphs.at(-1)!.at(-1)!;
    }
    private cursorFromRowCol(row: number, col: number): Position {
        if(row < 0) return this.glyphs[0][0];
        else if(row >= this.glyphs.length) return this.cursorAtEOF();
        else if(col < 0) return this.glyphs[row][0];
        else if(col >= this.glyphs[row].length) return this.glyphs[row].at(-1)!;
        else return this.glyphs[row][col];
    }
    public cursorFromC(c: number): Position {
        if(c <= 0) return this.glyphs[0][0];
        for(const g of this) {
            if(g.c === c) return g;
        }
        return this.glyphs.at(-1)!.at(-1)!;
    }
    
    private setCursor(newValue: Position, extendSelection = false, columnMode = false) {
        if(extendSelection && this.anchor === null && newValue.c !== this.cursor.c) {
            this.anchor = {...this.cursor};
        } else if(!extendSelection || newValue.c === this.anchor?.c) {
            this.anchor = null;
        }
        this.cursor = newValue;
        this.updateSelections(columnMode);
    }
    private getState(type: UndoType | null = null): TextState {
        return {
            text: this.text,
            caret: {...this.cursor},
            type
        }
    }
    private restoreState(state: TextState | undefined) {
        if(state) {
            this.setText(state.text);
            this.anchor = null;
            this.setCursor(state.caret);
        }
    }    
}