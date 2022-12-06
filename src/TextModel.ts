import { UndoBuffer } from "./UndoBuffer";
enum UndoType {
    INSERT,
    DELETE
}
interface UndoState {
    text: string;
    cursorX: number;
    cursorY: number;
    type: UndoType | null;
}
/**
 * A abstract model for the text and cursor/selection in a text editor.
 *
 * The text content is accessible via the .text property.
 *
 * The selection and cursor are stored internally as an X (position along line)
 * and y (line number) for the cursor, and an optional anchor point for the
 * character after the start of the selection. If the cursor is before the
 * anchor then the selection is a 'backwards' one and selection changes will
 * operate differently.
 * 
 * Events
 * ===
 * This 'update' event will be emitted whenever the 
 */
export class TextModel {
    private _text: string = "";
    // The length of each line in _text, including trailing newlines
    private lineLengths: number[] = [0];
    // How far along the line the cursor is, expressed as codepoints (not characters/code units)
    // This can exceed the current line length, in which case the cursor will be drawn at the
    // end of the line but if we navigate vertically it will remember its true position
    private cursorX = 0;
    // Which line the cursor is on
    private cursorY = 0;
    private anchor: number | null = null;
    private history = new UndoBuffer<UndoState>({text: this.text, cursorX: this.cursorX, cursorY: this.cursorY, type: null});

    public get text(): string {
        return this._text;
    }
    public set text(newValue: string) {
        this._text = newValue;
        // Add one to the length of every line except the last to account for
        // the newline we removed by using split()
        this.lineLengths = newValue.split("\n").map((line, index, array) => [...line].length + (index == array.length-1 ? 0 : 1));
    }
    /**
     * Get the cursor position as an offset from the start of the text
     */
    public get cursor(): number {
        return this.cursorOffsetFromXY(this.cursorX, this.cursorY);
    }

    public set cursor(newValue: number) {
        [this.cursorX, this.cursorY] = this.cursorXYFromOffset(newValue);
    }

    /**
     * Get the cursorX/Y pair for the end of the current document
     */
    public eofXY() {
        const y = this.lineLengths.length - 1;
        return [this.lineLengths[y], y];
    }

    /**
     * Get the length of a given line, excluding trailing \n
     * @param line The line to get the length of
     * @returns 
     */
    public lineLength(line: number): number {
        if(line == this.lineLengths.length - 1) {
            return this.lineLengths[line];
        } else {
            return this.lineLengths[line] - 1;
        }
    }
    /**
     * Get the start of the selection as an offset from the start of the text.
     *
     * This will always be less than or equal to selectionEnd, even if the
     * selection is backwards (ie the cursor is at the start of the selection).
     *
     * If there is no selection, this will be equal to selectionEnd and the
     * cursor position.
     */
     public get selectionStart(): number {
        if(this.anchor !== null) return Math.min(this.cursor, this.anchor);
        else return this.cursor;
    }

    /**
     * Get the end of the selection as an offset from the start of the text.
     *
     * This will always be greater than or equal to selectionStart, even if the
     * selection is backwards (ie the cursor is at the start of the selection).
     *
     * If there is no selection, this will be equal to selectionStart and the
     * cursor position.
     */
    public get selectionEnd(): number {
        if(this.anchor !== null) return Math.max(this.cursor, this.anchor);
        else return this.cursor;
    }

    /**
     * Get all text before the selection (or cursor, if there is no selection)
     */
    public get preSelection(): string {
        return [...this.text].slice(0, this.selectionStart).join("");
    }
    /**
     * Get all text after the selection (or cursor, if there is no selection)
     */
    public get postSelection(): string {
        return [...this.text].slice(this.selectionEnd).join("")
    }
    /**
     * Get the currently selected text. If there is no selection, return an
     * empty string.
     */
    public get selection(): string {
        return [...this.text].slice(this.selectionStart, this.selectionEnd).join("")
    }

    public selectAll() {
        this.anchor = 0;
        [this.cursorX, this.cursorY] = this.eofXY();
    }
    /**
     * Insert a character or block of text
     * 
     * Batch insert operations always create their own undo state. Non-batch
     * inserts when the inserted text isn't whitespace will merge with previous
     * inserts in the undo buffer, so a single undo operation will undo all
     * such inserts in one go.
     * 
     * @param text Text to insert
     * @param batch If this is a batch operation (eg paste, mouse drop)
     */
    public insert(text: string, batch = false) {
        text = text.replace(/\r\n/g, "\n");
        // The new cursor position will always be after the inserted text
        const newCursor = this.selectionStart + [...text].length;
        this.text = this.preSelection + text + this.postSelection;
        this.cursor = newCursor;
        this.anchor = null;
        this.history.save({text: this.text, cursorX: this.cursorX, cursorY: this.cursorY, type: UndoType.INSERT}, !batch && text.trim().length !== 0); 
    }

    /**
     * Perform a deletion operation.
     * 
     * If there is selected text, remove it. Otherwise, remove one character
     * either before or after the cursor.
     * @param direction Which character to delete if there's no selected text
     */
    public delete(direction: CursorDirection) {
        let canReplace = true;
        if(this.anchor !== null) {
            const newCursor = this.selectionStart;
            this.text = this.preSelection + this.postSelection;
            this.cursor = newCursor;
            canReplace = false;
        } else if(direction == CursorDirection.Forward) {
            const newCursor = this.cursor;
            this.text = this.preSelection + this.postSelection.substring(1);
            // Force a new cursor value even though it's not changed as this will
            // reset cursorX to the actual position
            this.cursor = newCursor;
        } else {
            const newCursor = Math.max(0, this.cursor - 1);
            this.text = this._text.substring(0, newCursor) + this.postSelection;
            this.cursor = newCursor;
        }
        // Clear the selection
        this.anchor = null;
        this.history.save({text: this.text, cursorX: this.cursorX, cursorY: this.cursorY, type: UndoType.DELETE}, canReplace);
    }

    /*
    Cursor behaviour:
    Movement with no extend:
    - If selection, use side of selection in the direction of travel
    - Otherwise use cursor position
    - Find actual cursor position, clamping to line end
    - Add/subtract
    
    Movement with extend:
    - Always use cursor position

    */

    /**
     * Turn a cursor value as an offset into X/Y cursor position
     *
     * X will always be within line Y rather than a virtual value off the end of
     * the line
     *
     * @param offset Offset in codepoints from start of the text
     * @returns [x, y] cursor values 
     */
    private cursorXYFromOffset(offset: number): [number, number] {
        // Clamp negative offsets
        offset = Math.max(0, offset);
        // Offset of the start of the current line
        let lineStart = 0;
        // Iterate through all lines until we find one that contains offset
        for(let [line, lineLength] of this.lineLengths.entries()) {
            if(offset >= lineStart && offset < lineStart + lineLength) {
                return [offset - lineStart, line];
            }
            // Start of the next line, including the newline
            lineStart += lineLength;
        }
        let y = this.lineLengths.length - 1;
        return [this.lineLengths[y], y];
    }

    private cursorOffsetFromXY(x: number, y: number): number {
        const toLineStart = this.lineLengths.slice(0, y).reduce((prev, cur) => prev + cur, 0);
        return toLineStart + Math.min(this.lineLength(y), x);
    }
    /**
     */
    public moveCursor(direction: CursorDirection, distance: MoveDistance, extend = false) {
        // The x/y cursor location we're going to be moving from For simple
        // moves this is the current cursor, but if we have an existing
        // selection it will be the side of the selection in the direction of
        // travel If we're creating/extending a selection it will always be the
        // cursor as moving against the direction of the selection means
        // reducing the size of the selection
        let fromX, fromY: number;

        // If we're creating a selection, we always move relative to the actual cursor
        // Likewise if we have no active selection there's no decision to make
        if(extend || this.anchor == null) {
            [fromX, fromY] = [this.cursorX, this.cursorY];
        } else if(direction === CursorDirection.Forward) {
            [fromX, fromY] = this.cursorXYFromOffset(this.selectionEnd);
        } else {
            [fromX, fromY] = this.cursorXYFromOffset(this.selectionStart);
        }

        // If we're starting a new selection, save the anchor
        if(extend && this.anchor === null) this.anchor = this.cursor;
        // If we're not selecting, drop any existing selection
        if(!extend) this.anchor = null;

        // Where the cursor will end up
        let [toX, toY] = [fromX, fromY];

        switch(distance) {
            case MoveDistance.Character: {
                const mod = direction === CursorDirection.Forward ? +1 : -1;
                
                [toX, toY] = this.cursorXYFromOffset(this.cursorOffsetFromXY(toX, toY) + mod);
                break;
            }
            case MoveDistance.Line: {
                const mod = direction === CursorDirection.Forward ? +1 : -1;
                toY += mod;
                break;
            }
            case MoveDistance.LineEnd: {
                if(direction == CursorDirection.Forward) {
                    toX = this.lineLength(toY);
                } else {
                    toX = 0;
                }
                break;
            }
            case MoveDistance.Word: {
                // Move in the direction of travel until we have passed
                // at least one non-whitespace, then stop at the next
                // whitespace
                const from = this.cursorOffsetFromXY(fromX, fromY);
                // Cursor is expressed as codepoints, *not* characters, so do this
                const scanCPs = direction === CursorDirection.Forward ? 
                    [...this._text].slice(from).join("") :
                    [...this._text].slice(0, from).reverse().join("");
                
                const offset = scanCPs.search(/(?<=\S)\s/);
                if(direction === CursorDirection.Forward) {
                    if(offset === -1) [toX, toY] = this.eofXY();
                    else [toX, toY] = this.cursorXYFromOffset(from + offset);
                } else {
                    if(offset === -1) [toX, toY] = [0, 0];
                    else [toX, toY] = this.cursorXYFromOffset(from - offset);
                }
                break;
            }
            case MoveDistance.Document: {
                if(direction === CursorDirection.Forward) {
                    [toX, toY] = this.eofXY()
                } else {
                    [toX, toY] = [0, 0];
                }
            }
            
        }
        // cursorX can exceed current line length, but cursorY can't go out of bounds
        this.cursorX = toX;
        this.cursorY = Math.min(this.lineLengths.length - 1, Math.max(0, toY));
    }

    public undo() {
        this.restoreState(this.history.undo());
    }
    public redo() {
        this.restoreState(this.history.redo());
    }

    private restoreState(state: UndoState | undefined) {
        if(state) {
            this.text = state.text;
            this.cursorY = state.cursorX;
            this.cursorY = state.cursorY;
            this.anchor = null;
        }
    }    
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