import { Font, isRawFont } from "./Font";
import TextController, { Controller } from "./TextController";
import { Coord, Cursor, TextModel } from "./TextModel";
import TextView from "./TextView";

const STYLESHEET = `
    :host {
        border: 1px solid black;
        cursor: text;
        overflow: auto;
        width: 200px;
        height: 100px;
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

export class BaseTextElement extends HTMLElement {
    protected _fontSrc: string = "";

    /** Starting text value, saved until the first time a font is loaded and we can instantiate a Model */
    protected _initialValue: string = "";
    
    protected font?: Font;
    protected fontTexture?: ImageBitmap;

    
    protected model?: TextModel;
    protected viewer?: TextView;
    protected controller?: Controller;

    
    // HTMLElements used to build the shadow DOM
    protected stylesheet: HTMLStyleElement;
    protected canvas: HTMLCanvasElement = document.createElement("canvas");
    protected context = this.canvas.getContext("bitmaprenderer") as ImageBitmapRenderingContext;
    protected spinner: HTMLSlotElement;
    protected errorElement: HTMLDivElement;
    protected errorMessage: HTMLParagraphElement;
    protected container: HTMLDivElement;
    // Dynamic CSS declarations we use to pick up style applied to us
    protected textStyle?: CSSStyleDeclaration;
    protected selectStyle?: CSSStyleDeclaration;

    constructor() {
        super();
        this.attachShadow({mode: "open"});
        // Maybe this should be done with an innerHTML'd template
        // and clone, then pick the nodes out with querySelector()
        
        this.stylesheet = document.createElement("style");
        this.stylesheet.innerHTML = this.getStyle();
        this.container = document.createElement("div");
        this.container.id = "container";
        
        this.spinner = document.createElement("slot");
        this.spinner.name = "spinner";
        this.spinner.hidden = true;
        const defaultSpinner = document.createElement("div");
        defaultSpinner.className = "lds-dual-ring";
        this.spinner.appendChild(defaultSpinner);
        
        this.errorElement = document.createElement("div");
        this.errorElement.id="error";
        this.errorElement.hidden = true;
        const errorTitle = document.createElement("h1");
        errorTitle.innerText = "Error";
        this.errorElement.appendChild(errorTitle);

        this.errorMessage = document.createElement("p");
        this.errorElement.appendChild(this.errorMessage);

        this.textStyle = getComputedStyle(this);
        this.selectStyle = getComputedStyle(this, "::selection");        

    }

    public static get observedAttributes(): string[] {
        return ["fontsrc", "value"];
    }
    public attributeChangedCallback(name: string, oldValue: string|null, newValue: string|null): void {
        switch(name) {
            case "fontsrc": {
                this.fontSrc = newValue || "";
                break;
            }
            case "value": {
                this.value = newValue || "";
                break;
            }
            default:
                console.log(name, "set to", newValue, typeof(newValue));
        }
    }

    public connectedCallback() {
        if(this.isConnected) {
            
            this.setAttribute("contenteditable", "");
            this.setAttribute("tab-index", "0");
            this.setAttribute("draggable", "true");
            this.setAttribute("aria-role", "textarea");
            this.setAttribute("aria-multiline", "true");

            const container = this.container;

            container.appendChild(this.stylesheet);
            container.appendChild(this.canvas);
            
            container.appendChild(this.spinner);
            container.appendChild(this.errorElement);

            this.shadowRoot?.appendChild(container);

            if(!this.fontSrc || this.fontSrc === "") {
                this.showError("Need a fontSrc");
            }
            // TODO: Work out the possible orderings of font
            // load/disconnected/connected. Are there scenarios where we need to
            // call model.addEventListener and controller.listen here?
        }
    }
    public disconnectedCallback() {
        this.controller?.detach();
    }
    public get fontSrc() {
        return this._fontSrc;
    }
    public set fontSrc(newValue: string) {
        if(this._fontSrc !== newValue) {
            this._fontSrc = newValue;
            this.loadFont(newValue);
        }
    }
    public get value() {
        return this._initialValue;
    }
    public set value(newValue: string) {
        this._initialValue = newValue;
        if(this.model) this.model.reset(newValue);
    }

    /**
     * Return the offset from the top/left of the element and
     * the top/left of the canvas where we're rendering text,
     * to allow us to locate clicks correctly relative to text.
     */
    public getCanvasOffset(): [number, number] {
        // Correct for scrolling, but not padding (as the offsetX/Y already does
        // that for us)
        let offsetLeft = this.container.offsetLeft;
        let offsetTop = this.container.offsetTop;
        // If the text-editor element has a position of 'relative' then it will
        // be the offsetParent of the container, otherwise both will have a common
        // offsetParent further up the DOM tree (oddly I don't think you can
        // prevent this even though it sort of breaches the shadow DOM).
        if(this.container.offsetParent !== this) {
            offsetLeft -= this.offsetLeft;
            offsetTop -= this.offsetTop;
        }
        return [
            this.scrollLeft - offsetLeft,
            this.scrollTop - offsetTop
        ];
    }
    
    /**
     * Apply scrolling and offsets to turn a mouse event (over the whole element) into
     * coordinates relative to the top/left of the drawing canvas.
     * 
     * @param ev MouseEvent
     */
    public coordFromMouseEvent(ev: MouseEvent): Coord {
        const [leftOffset, topOffset] = this.getCanvasOffset();
        return {
            x: ev.offsetX + leftOffset,
            y: ev.offsetY + topOffset
        }
    }
    protected getStyle() {
        return STYLESHEET;
    }
    private showError(message: string) {
        this.errorMessage.innerText = message;
        this.errorElement.hidden = false;
        this.spinner.hidden = true;
    }
    
    private async loadFont(src: string) {
        this.spinner.hidden = false;
        this.errorElement.hidden = true;
        try {
            const fontResp = await fetch(src);
            if(!fontResp.ok) throw new Error(`Couldn't fetch font JSON data: ${fontResp.status} ${fontResp.statusText}`);
            const json = await fontResp.json();
            if(!isRawFont(json)) {
                console.error("Font JSON wasn't RawFont", json);
                throw new Error("Got invalid font JSON data");
            }
            const font: Font = new Font(json);

            const texURL = new URL(font.src, new URL(fontResp.url));
            const texResp = await(fetch(texURL));

            if(!texResp.ok) throw new Error(`Couldn't fetch font texture data: ${texResp.status} ${texResp.statusText}`);
            const blob = await texResp.blob();
            const fontTexture = await createImageBitmap(blob);
            this.font = font;
            this.fontTexture = fontTexture;
            this.postFontLoad();
            this.spinner.hidden = true;
        } catch(e) {
            console.error(e);
            this.showError("Error loading");
        }
    }
    protected postFontLoad(): void {

    }
    
}
export default class HTMLTextEditorElement extends BaseTextElement implements EventListenerObject {
    // Whether we draw helpers for whitespace characters
    private _showWhitespace = false;
    // The margin around the cursor to try and keep visible when scrolling
    private scrollMargin = {left: 1, right: 1, top: 1, bottom: 1};    

    public get showWhitespace() {
        return this._showWhitespace;
    }
    public set showWhitespace(newValue: boolean) {
        this._showWhitespace = newValue;
        if(this.viewer) this.viewer.showWhitespace = newValue;
    }

    
    protected postFontLoad(this: this & {font: Font, fontTexture: ImageBitmap}): void {

        this.scrollMargin = {
            left: this.font.maxWidth * 2,
            right: this.font.maxWidth,
            top: 0,
            bottom: this.font.lineHeight * 2
        };            
        if(this.model && this.viewer) {
            this.model.setFont(this.font);
            this.viewer.setFont(this.font, this.fontTexture);
        } else {
            this.model = new TextModel(this.font, this._initialValue);
            this.viewer = new TextView(this.model, this.font, this.fontTexture, this.context, this.textStyle!, this.selectStyle!, this.showWhitespace);
            this.controller = new TextController(this, this.model, this.viewer);
            this.controller.attach();
            this.model.addEventListener("selectionchange", this);
            this.model.addEventListener("change", this);
        }
    }

    public static get observedAttributes(): string[] {
        return ["fontsrc", "value", "show-whitespace"];
    }
    public attributeChangedCallback(name: string, oldValue: string|null, newValue: string|null): void {
        switch(name) {
            case "show-whitespace":
                // TODO: Convert to getter/setter?
                this._showWhitespace = newValue !== null;
                break;
            default:
                super.attributeChangedCallback(name, oldValue, newValue);
            
        }
    }
    public disconnectedCallback() {
        this.model?.removeEventListener("selectionchange", this);
        this.model?.removeEventListener("change", this);
        super.disconnectedCallback();
    }

    handleEvent(ev: Event): void {
        if(ev.type === "selectionchange") this.updateScroll();
        // Every event we see will be ones we listened to from the model, so
        // re-dispatch them from ourselves. We will need to extend this as and
        // when we end up with synthetic events more complex than Event()
        this.dispatchEvent(new Event(ev.type));
    }
    public get value(): string {
        if(this.model) return this.model.text;
        else return this._initialValue;
    }
    public set value(newValue: string) {
        super.value = newValue;
    }
    public get cursor(): Cursor | undefined {
        return this.model?.caret;
    }
    public get cursorX(): number {
        return this.model?.caret.x || 0;
    }
    public get cursorY(): number {
        return this.model?.caret.y || 0;
    }
    public get cursorRow(): number {
        return this.model?.caret.row || 0;
    }
    public get cursorCol(): number {
        return this.model?.caret.col || 0;
    }
    public get selectionLength(): number {
        return this.model?.getSelectionLength() || 0;
    }
    public get selectionPixels(): number {
        return this.model?.getSelectionWidth() || 0;
    }
    public insert(text: string) {
        if(this.model) this.model.insert(text, true);
    }
    public async getThumbnail(): Promise<Blob> {
        if(this.viewer) return this.viewer.getThumbnail();
        else return Promise.reject();
    }
    private updateScroll() {
        if(!this.model) return;
        // Turn the caret coordinates (which are relative to the canvas)
        // into coordinates relative to the container
        const relX = this.model.caret.x + this.canvas.offsetLeft;
        const relY = this.model.caret.y + this.canvas.offsetTop;
        let targetX = this.scrollLeft;
        let targetY = this.scrollTop;
        for(const x of [relX - this.scrollMargin.left, relX + this.scrollMargin.right]) {
            for(const y of [relY - this.scrollMargin.top, relY + this.scrollMargin.bottom]) {
                // Check if this would be visible based on our *current* scroll
                // target, so we don't bother re-doing a scroll if we'd already
                // see what we want
                if(x < targetX) {
                    targetX = x;
                } else if(x >= targetX + this.clientWidth) {
                    targetX = x - this.clientWidth;
                }
                if(y < targetY) {
                    targetY = y;
                } else if(y >= targetY + this.clientHeight) {
                    targetY = y - this.clientHeight;
                }
            }
        }
        if(targetX !== this.scrollLeft || targetY !== this.scrollTop) {
            this.scrollTo(targetX, targetY);
        }
    }
}
export function installWebComponent() {
    if(!customElements.get("text-editor")) {
        customElements.define('text-editor', HTMLTextEditorElement);
    }
}
installWebComponent();
