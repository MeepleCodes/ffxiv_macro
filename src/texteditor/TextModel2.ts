import { Font, Glyph } from './Font';

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
export class TextModel extends EventTarget {
    private lines = [""];
    private _text = "";
    /** Glyphs and cursors for every line plus an extra 'glyph' position at the end of each line with a null glyph and the location where the line ends */
    private glyphs: GlyphPosition[][] = [[DEFAULT_CURSOR]];
    private _caret = DEFAULT_CURSOR;
    private anchor: Cursor|null = null;
    private _selections: Selection[] = [];

    constructor(private font: Font) {
        super();
    }

    public set text(newValue: string) {
        // Fix up any newline mess
        this._text = newValue.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        this.lines = this._text.split("\n");
        let x = 0, y = 0, c = 0;
        this.glyphs = this.lines.map((line, row) => {
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
    public get text() {
        return this._text;
    }
    
    public get caret() {
        return this._caret;
    }
    public get selections() {
        return [...this._selections];
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
        return this.glyphs.slice(0, Math.max(0, row-1)).reduce((total, line) => total + line.length, col);
    }
    /**
     * Get the Cursor value closest to the supplied top/left coordinate
     * @param coord X/Y coordinate
     * @param extendX Whether to save an X value that exceeds line width in virtualX
     * @returns 
     */
    private cursorFromCoord(coord: Coord, extendX = false): Cursor {
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
                    const [prev, next] = this.glyphs[row].slice(i-1, i);
                    if(prev.x < coord.x && next.x > coord.x) {
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
        if(extendSelection && this.anchor === null) {
            this.anchor = {...this._caret};
        }
        if(!extendSelection) {
            this.anchor = null;
        }
        this._caret = newValue;
        this.updateSelections();
    }
    public setCaretToCoord(coord: Coord, extendSelection = false) {
        this.setCaret(this.cursorFromCoord(coord), extendSelection);
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
}