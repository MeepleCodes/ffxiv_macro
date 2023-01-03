/**
 * Stores undo history as a list of UndoState objects.
 *
 * The history array stores state in ascending age (most recent at 0) and the
 * index cursor points to the current state (that we cared to save).
 *
 * When we're just inserting entries index is 0 and the most recent state is
 * history[0], but as we perform undo operations index increases and points
 * further back in history. If index is > history.length there are no further
 * states we can revert to.
 *
 * Inserting new states when index is > 0 truncates the history array and
 * effectively starts a new timeline from there, so you can no longer use redo()
 * to return to the more recent states.
 *
 * Repeatedly performing actions of the same type (insert or delete) doesn't
 * create new history states; instead it overwrites the previous one. This means
 * when you undo it will undo a batch of single-character insert or deletes at
 * once, rather than doing each keypress individually. This is controlled by the
 * `type` field of an UndoState and the `overwrite` parameter in save() - if
 * overwrite is true *and* the type of the new state matches the most recent
 * undo state then it will overwrite instead of insert.
 * 
 * While this class doesn't make any restrictions about how that logic is applied,
 * the implementation currently behaves as such:
 * - Non-whitespace single-character inserts can overwrite each other
 * - Single-character delete or backspace can overwrite each other
 * - Typing a whitespace character will not overwrite; it starts a new state
 * - Pasting more than one character or deleting a selection starts a new state
 */
 export class UndoBuffer<T extends {type: any}> {
    /** History of undo states, from most recent to oldest */
    private history: T[];
    /** Position of the last saved state (if there is any). Normally 0,
     * increases as we undo and decreases as we redo */
    private index: number = 0;
    constructor(initialState: T) {
        this.history = [initialState];
    }
    public save(state: T, overwrite: boolean = false) {
        let in_past = false;
        // Discard any post-index history; we can't perform redo now we've written new state
        if(this.index > 0) {
            this.history = this.history.slice(this.index);
            this.index = 0;
            in_past = true;
        }
        if(!in_past && this.history.length > 0 && overwrite && state.type !== null && state.type === this.current?.type) {
            this.history[0] = state;
            // console.log("Overwriting previous undo state with ", this.current);
        } else {
            this.history.unshift(state);
            // console.log("Inserting new undo state of ", this.current);
        }
    }
    public get current(): T | undefined {
        if(this.index < this.history.length) return this.history[this.index];
        return undefined;
    }
    public undo(): T | undefined {
        if(this.index < this.history.length - 1) {
            this.index++;
            console.log("Undoing to state", this.current," index is now", this.index);
            return this.current;
        }
        return undefined;
    }
    public redo(): T | undefined {
        if(this.index > 0 && this.index < this.history.length) {
            this.index--;
            // console.log("Redoing to state", this.current," index is now", this.index);
            return this.current;
        }
        return undefined;
    }
    public reset(state: T) {
        this.index = 0;
        this.history = [state];
    }
}