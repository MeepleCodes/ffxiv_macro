import HTMLTextEditorElement from "./TextEditor";
import { TextDirection, MoveDistance, TextModel } from "./TextModel";
import TextView from "./TextView";
import log from 'loglevel';
const logger = log.getLogger("TextController");

type EventMap = {
    [type in keyof HTMLElementEventMap]?: {
        handler: (evt: HTMLElementEventMap[type]) => void,
        // handler: any,
        source: (that: HTMLTextEditorElement) => EventTarget,
        requiresReady: boolean
    }
}
const EVENT_MAP: EventMap = {};

function Handler(type: keyof HTMLElementEventMap, eventSource: (that: HTMLTextEditorElement) => EventTarget = (that: HTMLTextEditorElement) => that, requiresReady = true) {
    return function (target: TextController, propertyKey: any, descriptor: PropertyDescriptor) {
        EVENT_MAP[type] = {
            handler: target[propertyKey as keyof TextController] as any,
            source: eventSource,
            requiresReady
        };
    }
}
export interface Controller {
    attach(): void;
    detach(): void;
}
export default class TextController implements EventListenerObject, Controller {
    // A select operation is currently in progress (between mousedown and mouseup)
    private selecting = false;
    // A drag operation (with us as the source) is in progress (between dragstart and dragend)
    private dragging = false;    
    // Interval between caret on/off, in ms
    private blinkInterval = 500;
    // Whether the caret is currently blinking (meaning invisible)
    private blink = false;
    // Whether the editor has focus; the caret isn't shown if not
    private hasFocus = false;
    // Reference for the setInterval return used to control the caret blink
    private intervalRef: ReturnType<typeof setInterval> | null = null;
    private dragImage = new Image();

    constructor(private element: HTMLTextEditorElement, private model: TextModel, private viewer: TextView) {}
    public attach() {
        for(const [event, eventMap] of Object.entries(EVENT_MAP)) {
            eventMap.source(this.element).addEventListener(event, this);
        }
    }
    public detach() {
        for(const [event, eventMap] of Object.entries(EVENT_MAP)) {
            eventMap.source(this.element).removeEventListener(event, this);
        }        
        if(this.intervalRef) clearInterval(this.intervalRef);
    }
    private restartBlinking() {
        this.blink = false;
        if(this.viewer) this.viewer.caretVisible = !this.blink || !this.hasFocus;
        if(this.intervalRef) clearInterval(this.intervalRef);
        this.intervalRef = setInterval(() => {
            this.blink = !this.blink;
            if(this.viewer) this.viewer.caretVisible = !this.blink || !this.hasFocus;
        }, this.blinkInterval)        
    }
    public handleEvent(e: Event) : void {
        const map = EVENT_MAP[e.type as keyof EventMap];
        if(map !== undefined) {
            (map.handler as any).call(this, e as any as keyof HTMLElementEventMap);
        }
    }
    protected keyBindings: {key: string, shift?: boolean, test?: (ev: KeyboardEvent) => boolean, action: (ev: KeyboardEvent) => void}[] = [
        {key: "c", action: this.clipboardCopy},
        {key: "x", action: this.clipboardCut},
        {key: "v", action: this.clipboardPaste},
        {key: "a", action: this.selectAll},
        {key: "z", shift: false, action: this.undo},
        {key: "z", shift: true, action: this.redo}
    ];
    protected clipboardCopy(ev_: Event) {
        const selection = this.model.getSelectedText();
        if(selection !== null) {
            navigator.clipboard.writeText(selection);
        }
    }
    protected clipboardCut(ev_: Event) {
        const selection = this.model.getSelectedText();
        if(selection !== null) {
            navigator.clipboard.writeText(selection);
            this.model.delete();
        }

    }
    protected clipboardPaste(ev_: Event ) {
        navigator.clipboard.readText().then((text) => {
            if(text.length > 0) {
                this.model.insert(text, true);
                this.restartBlinking();
            }
        });
    }
    protected selectAll(ev: Event) {
        this.model.selectAll();
    }
    protected undo(ev_: Event) {
        this.model.undo();
    }
    protected redo(ev_: Event) {
        this.model.redo();
    }
    /*
    * Mouse and drag event interactions

    Mousedown
    - If there is a selection *and* the mouse is within it, do nothing (will allow dragstart to run)
    - Otherwise, move the cursor here and set "selecting"

    Mouseup
    - If dragging, do nothing
    - If selecting, move cursor and end selecting
    - Otherwise if shift, move cursor w/ extend
    - Else move cursor w/out extend

    Mousemove
    - If no button down, clear selecting and dragging (just in case)
    - If button down and selecting, extend selection
    - If button down and not selecting, do nothing (will be dragging, handled in dragover)

    Dragstart
    - If no selection, cancel
    - If selecting, do cancel
    - Otherwise, set drag content to selection text
      - And fix the image

    Dragend (fires on source)
    - If dropEffect is move, delete the selected text (otherwise leave it as-is, including selection)
    - Set dragging to false

    Dragenter (fires on target)
    - Prevent default to permit drop operation (probably check we can handle the drag data first)

    Dragover (fires on target)
    - If the source is ourselves *and* the mouse is inside the selection, show no insertion cursor
    - Otherwise, show insertion cursor at the current mouse position

    Drop (fires on target)
    - If there is an insertion point, insert the text at the insertion point
    - Otherwise, cancel the drop (if we're dragging over ourself and didn't leave the selection)


    - Create the drag image by slicing out of the canvas around the selection
    */


    @Handler("mousedown")
    protected mouseDowned(ev: MouseEvent) {
        if(ev.button === 0){
            const coord = this.element.coordFromMouseEvent(ev);
            if(!this.model.isInSelection(coord)) {
                logger.debug("Mousedown, moving caret", ev.shiftKey);
                this.model.setCaretToCoord(coord, ev.shiftKey, ev.altKey);
                this.selecting = true;
            }
        }
    }
    @Handler("mouseup")
    protected mouseUpped(ev: MouseEvent) {
        if(ev.button === 0 && !this.dragging) {
            logger.debug("Mouseup, ending selecting", ev.shiftKey);
            this.model.setCaretToCoord(this.element.coordFromMouseEvent(ev), ev.shiftKey || this.selecting, ev.altKey);
            this.selecting = false;
        }
    }
    @Handler("mousemove")
    protected mouseMoved(ev: MouseEvent) {
        if(!(ev.buttons & 1)) {
            this.dragging = false;
            this.selecting = false;
        } else if(this.selecting) {
            const coord = this.element.coordFromMouseEvent(ev);
            log.debug("Mouse moving selection to", coord, "from", ev.offsetX, ev.offsetY);
            this.model.setCaretToCoord(coord, true, ev.altKey);
        }
    }
    @Handler("dragstart")
    protected dragStarted(ev: DragEvent) {
        const selectedText = this.model.getSelectedText();
        if(selectedText !== null && !this.selecting) {
            const dt = ev.dataTransfer;
            if(dt) {
                dt.clearData();
                dt.setData("text/plain", selectedText);
                dt.effectAllowed = "copyMove";
                dt.dropEffect = "move";
                // TODO: Set the drag image to the currently selected text (only)
                dt.setDragImage(this.dragImage, 0, 0);
            }
            
            this.dragging = true;
        } else {
            ev.preventDefault();
        }
        
    }
    @Handler("dragend")
    protected dragEnded(ev: DragEvent) {
        if(ev.dataTransfer?.dropEffect === "move" && this.model.getSelectedText() !== null) {
            this.model.delete(TextDirection.Forward);
        }
        this.dragging = false;
    }

    @Handler("dragenter")
    protected dragEntered(ev: DragEvent) {
        if(ev.dataTransfer?.types.includes("text/plain")) {
            ev.preventDefault();        
        } else {
            console.log("Rejecting drag-over event, can't handle a data transfer with types", ev.dataTransfer?.types, ev.dataTransfer?.items);
        }
    }
    @Handler("dragover")
    protected draggedOver(ev: DragEvent) {
        // If we're also dragging then assume we are currently both drag and
        // dragover targets (there's no precise way to ensure this but it seems
        // safe). In which case, only show an insertion cursor if the mouse
        // isn't over the selection (which we're trying to drag)
        const coord = this.element.coordFromMouseEvent(ev);
        if(!this.dragging || !this.model.isInSelection(coord)) {
            this.viewer.insertionCursor = this.model.cursorFromCoord(coord);
            if(ev.dataTransfer) ev.dataTransfer.dropEffect = ev.ctrlKey ? "copy" : "move";
        } else {
            this.viewer.insertionCursor = null;
            if(ev.dataTransfer) ev.dataTransfer.dropEffect = "none";
        }
        ev.preventDefault();
    }
    @Handler("drop")
    protected dropped(ev: DragEvent) {
        // If we dropped on ourself without leaving our own selection,
        // abort to avoid moving
        const coord = this.element.coordFromMouseEvent(ev);
        if(this.dragging && this.model.isInSelection(coord)) {
            ev.preventDefault();
        } else {
            // If this was a move, and from ourself to ourself, delete the existing
            // text first (as this event fires before dragEnded does)
            if(this.dragging && !ev.ctrlKey) {
                this.model.delete(TextDirection.Forward, true);
            }
            // Clear the existing selection and move to the insertion point
            this.model.setCaretToCoord(coord, false);
            const dropData = ev.dataTransfer?.getData("text/plain");
            if(dropData !== undefined) this.model.insert(dropData, true);
            this.viewer.insertionCursor = null;
        }
    }
    @Handler("dragleave")
    protected dragLeft(ev: DragEvent) {
        // If the drag-over ended with a drop, insertion will have already been
        // nulled so skip the redraw
        if(this.viewer.insertionCursor !== null) {
            this.viewer.insertionCursor = null;
        }
    }
 
    /**
     * Keydown event handler
     * 
     * Delegates a lot of work out to the functions defined in keyBindings,
     * which is where we define any ctrl+<key> bindings and the like.
     * 
     * It also handles 'special' keys like the arrows, space, enter, delete.
     * 
     * Those could probably be pushed into the keyBindings object to make
     * this function shorter
     * @param ev Keyboard event
     */
    @Handler("keydown")
    protected keyDowned(ev: KeyboardEvent) {
        let preventDefault = true;
        let wasControl = false;
        // Control bindings
        if(ev.ctrlKey) {
            // Handle the problem that key can be upper- or lower-case
            // depending on whether capslock is on and/or we're a ctrl+shift
            // binding 
            const key = ev.key.toLowerCase();
            for(let b of this.keyBindings) {
                if(b.key === key && (b.shift === undefined || b.shift === ev.shiftKey) && (b.test === undefined || b.test(ev))) {
                    b.action.call(this, ev);
                    wasControl = true;
                    break;
                }
            }
        }
        // If it's a typeable character then it will have a single codepoint
        // But not it any control keys are held down
        if([...ev.key].length === 1 && !(ev.altKey || ev.ctrlKey || ev.metaKey || ev.isComposing)) {
            if(ev.key === " " && ev.shiftKey) {
                this.model.insert(String.fromCodePoint(0x3000));
            } else {
                this.model.insert(ev.key);
            }
            this.restartBlinking();
        } else if(!wasControl) {
            switch(ev.key) {
            case "Enter":
            case "Return":
                this.model.insert("\n");
                this.restartBlinking();
                break;
            // Ctrl+delete/backspace are sometimes "delete entire word"
            case "Delete":
                if(ev.shiftKey) {
                    this.clipboardCut(ev);
                } else {
                    this.model.delete(TextDirection.Forward);
                    this.restartBlinking();
                }
                break;
            case "Backspace":
                this.model.delete(TextDirection.Backward);
                this.restartBlinking();
                break;
            case "Insert":
                if(ev.shiftKey) {
                    this.clipboardPaste(ev);
                } else if(ev.ctrlKey) {
                    this.clipboardCopy(ev);
                }
                break;
            case "Right":
            case "ArrowRight": {
                this.model.moveCaret(TextDirection.Forward, ev.ctrlKey ? MoveDistance.Word : MoveDistance.Character, ev.shiftKey);
                this.restartBlinking();
                break;
            }
            case "Left":
            case "ArrowLeft": {
                this.model.moveCaret(TextDirection.Backward, ev.ctrlKey ? MoveDistance.Word : MoveDistance.Character, ev.shiftKey);
                this.restartBlinking();
                break;
            }
            // TODO: Ctrl+Up/Down could be scroll instead of move
            case "Up":
            case "ArrowUp": {
                this.model.moveCaret(TextDirection.Backward, MoveDistance.Line, ev.shiftKey);
                this.restartBlinking();
                break;
            }
            case "Down":
            case "ArrowDown": {
                this.model.moveCaret(TextDirection.Forward, MoveDistance.Line, ev.shiftKey);
                this.restartBlinking();
                break;
            }
            case "Home": {
                this.model.moveCaret(TextDirection.Backward, ev.ctrlKey ? MoveDistance.Document : MoveDistance.LineEnd, ev.shiftKey);
                this.restartBlinking();
                break;
            }
            case "End": {
                this.model.moveCaret(TextDirection.Forward, ev.ctrlKey ? MoveDistance.Document : MoveDistance.LineEnd, ev.shiftKey);
                this.restartBlinking();
                break;
            }
            default: {
                // console.log("Unhandled key", ev.key);
                preventDefault = false;
            }
            }
        }
        if(preventDefault) ev.preventDefault();
    }
    @Handler("focus")
    @Handler("blur")
    focusChanged(e: FocusEvent): void {
        if(e.type === "blur") this.hasFocus = false;
        else {
            this.hasFocus = true;
        }
        this.restartBlinking();
    }
}
