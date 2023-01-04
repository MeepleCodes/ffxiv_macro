import { Font, Glyph } from './Font';
import { UndoBuffer } from './UndoBuffer';
import log from 'loglevel';
const logger = log.getLogger("TextModel");


export const EOL_SELECTION_MARGIN = 3;
export type Coord = {
    readonly y: number,
    readonly x: number
}
export type Cursor = Coord & {
    readonly virtualX?: number;
    readonly row: number;
    readonly col: number;
    readonly c: number;
}
const DEFAULT_CURSOR: Cursor = {x: 0, y: 0, row: 0, col: 0, c: 0};
export type GlyphPosition = Cursor & {
    glyph?: Glyph;
}
export interface Selection {
    x: number;
    y: number;
    w: number;
    h: number;
}

export enum CursorDirection {
    Forward,
    Backward
}
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
    caret: Cursor;
    type: UndoType | null;
}
export class TextModel extends EventTarget {
    private lines = [""];
    private _text = "";
    /** Glyphs and cursors for every line plus an extra 'glyph' position at the end of each line with a null glyph and the location where the line ends */
    private glyphs: GlyphPosition[][] = [[DEFAULT_CURSOR]];
    private _caret = DEFAULT_CURSOR;
    private anchor: Cursor|null = null;
    private _selections: Selection[] = [];
    private history: UndoBuffer<TextState> = new UndoBuffer<TextState>(this.getState());

    constructor(private font: Font, initialValue: string = "") {
        super();
        this.reset(initialValue);
    }

    public setFont(newValue: Font) {
        this.font = newValue;
        this.layoutGlyphs();
    }
    public reset(text: string) {
        this.setText(text);
        this.history.reset(this.getState());
    }
    private setText(newValue: string) {
        // Fix up any newline mess
        this._text = newValue.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        this.lines = this._text.split("\n");
        this.layoutGlyphs();
    }
    public get text() {
        return this._text;
    }
    
    public get caret() {
        return this._caret;
    }
    public get selections() {
        return [...this._selections];
    }
    public getSelectionLength(): number {
        return this.selectionEnd.c - this.selectionStart.c;
    }
    public getSelectionWidth(): number {
        return this.selections.reduce((total, selection) => total + selection.w, 0);
    }
    public getSelectedText(): string|null {
        if(this.anchor === null) return null;
        return this._text.slice(this.selectionStart.c, this.selectionEnd.c);
    }
    public isInSelection(coord: Coord) {
        return this.selections.some(s => s.x <= coord.x && s.x + s.w >= coord.x && s.y <= coord.y && s.y + s.h >= coord.y);
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
        this.anchor = DEFAULT_CURSOR;
        this.setCaret(this.cursorAtEOF(), true);
    }
    public setCaretToCoord(coord: Coord, extendSelection = false) {
        const cursor = this.cursorFromCoord(coord);
        logger.debug("Setting caret to", cursor, "from", coord);
        this.setCaret(cursor, extendSelection);
    }
    public moveCaret(direction: CursorDirection, distance: MoveDistance, extendSelection = false) {
        const moveFrom: Cursor = (!extendSelection && this.anchor !== null) ? (
            direction === CursorDirection.Backward ? this.selectionStart : this.selectionEnd
        ) : this._caret;
        let newCursor: Cursor|null = null;
        switch(distance) {
            case MoveDistance.Character: {
                const mod = direction === CursorDirection.Forward ? +1 : -1;
                newCursor = this.cursorFromC(moveFrom.c + mod);
                break;
            }
            case MoveDistance.Line: {
                const mod = (direction === CursorDirection.Forward ? +1 : -1) * this.font.lineHeight;
                newCursor = this.cursorFromCoord({x: moveFrom.x, y: moveFrom.y + mod}, true);
                break;
            }
            case MoveDistance.LineEnd: {
                if(direction === CursorDirection.Forward) {
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
                const scanCPs = direction === CursorDirection.Forward ? 
                    [...this._text].slice(from).join("") :
                    [...this._text].slice(0, from).reverse().join("");
                
                const offset = scanCPs.search(/(?<=\S)\s/);
                if(direction === CursorDirection.Forward) {
                    if(offset === -1) newCursor = this.cursorAtEOF();
                    else newCursor = this.cursorFromC(from + offset);
                } else {
                    if(offset === -1) newCursor = {...DEFAULT_CURSOR};
                    else newCursor = this.cursorFromC(from - offset);
                }
                break;
            }
            case MoveDistance.Document: {
                if(direction === CursorDirection.Forward) {
                    newCursor = this.cursorAtEOF();
                } else {
                    newCursor = {...DEFAULT_CURSOR};
                }
            }
            
        }
        this.setCaret(newCursor, extendSelection);
    }
    public insert(text: string, batch = false) {
        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        // The new cursor position will always be after the inserted text
        const newC = this.selectionStart.c + [...text].length;
        this.setText(this.getPreSelection()
             + text
             + this.getPostSelection());
        this._caret = this.cursorFromC(newC);
        this.anchor = null;
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
    public delete(direction: CursorDirection = CursorDirection.Forward, bypassUndo = false) {
        let canReplace = true;
        if(this.anchor !== null) {
            const newCursor = this.selectionStart;
            this.setText(this.getPreSelection() + this.getPostSelection());
            this.setCaret(newCursor);
            canReplace = false;
        } else if(direction === CursorDirection.Forward) {
            const newCursor = this.caret;
            this.setText(this.getPreSelection() + this.getPostSelection().substring(1));
            // Force a new cursor value even though it's not changed as this will
            // reset cursorX to the actual position
            this.setCaret(newCursor);
        } else {
            
            const newCursor = this.cursorFromC(Math.max(0, this.caret.c - 1));
            this.setText(this.getPreSelection().substring(0, newCursor.c) + this.getPostSelection());
            this.setCaret(newCursor);
        }
        // Clear the selection
        this.anchor = null;
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
    private layoutGlyphs() {
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
        this.setCaret(DEFAULT_CURSOR);
    }
    private getLineWidth(line: number): number {
        return this.glyphs[line].at(-1)!.x;
    }
    private get selectionStart(): Cursor {
        return this.anchor === null ? this._caret : (
            this.anchor.c > this._caret.c ? this._caret : this.anchor
        );
    }
    private get selectionEnd(): Cursor {
        return this.anchor === null ? this._caret : (
            this.anchor.c > this._caret.c ? this.anchor : this._caret
        );
    }
    private updateSelections() {
        this._selections = [];
        if(this.anchor !== null) {
            const [start, end] = [this.selectionStart, this.selectionEnd];
            for(let row = start.row; row<=end.row; row++) {
                const x = row === start.row ? start.x : 0;
                this._selections.push({
                    x,
                    y: this.font.lineHeight * row,
                    w: (row === end.row ? end.x : this.getLineWidth(row) + EOL_SELECTION_MARGIN) - x,
                    h: this.font.lineHeight
                });
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
    public cursorFromCoord(coord: Coord, extendX = false): Cursor {
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
    private cursorAtEOF(): Cursor {
        return this.glyphs.at(-1)!.at(-1)!;
    }
    private cursorFromRowCol(row: number, col: number): Cursor {
        if(row < 0) return this.glyphs[0][0];
        else if(row >= this.glyphs.length) return this.cursorAtEOF();
        else if(col < 0) return this.glyphs[row][0];
        else if(col >= this.glyphs[row].length) return this.glyphs[row].at(-1)!;
        else return this.glyphs[row][col];
    }
    private cursorFromC(c: number): Cursor {
        if(c <= 0) return this.glyphs[0][0];
        for(const g of this) {
            if(g.c === c) return g;
        }
        return this.glyphs.at(-1)!.at(-1)!;
    }
    
    private setCaret(newValue: Cursor, extendSelection = false) {
        logger.debug("Setting caret to", newValue,extendSelection ? "with" : "without", "extending selection");
        if(extendSelection && this.anchor === null && newValue.c !== this._caret.c) {
            this.anchor = {...this._caret};
        } else if(!extendSelection || newValue.c === this.anchor?.c) {
            this.anchor = null;
        }
        this._caret = newValue;
        this.updateSelections();
    }
    private getState(type: UndoType | null = null): TextState {
        return {
            text: this.text,
            caret: {...this.caret},
            type
        }
    }
    private restoreState(state: TextState | undefined) {
        if(state) {
            this.setText(state.text);
            this.anchor = null;
            this.setCaret(state.caret);
        }
    }    
}