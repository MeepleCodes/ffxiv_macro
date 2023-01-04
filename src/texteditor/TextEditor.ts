import { Font, isRawFont } from "./Font";
import { TextController } from "./TextController";
import { Cursor, TextModel } from "./TextModel";
import { TextViewer } from "./TextViewer";

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


export default class HTMLTextEditorElement extends HTMLElement {
    private _fontSrc: string = "";
    public get fontSrc() {
        return this._fontSrc;
    }
    public set fontSrc(newValue: string) {
        if(this._fontSrc !== newValue) {
            this._fontSrc = newValue;
            this.loadFont(newValue);
        }
    }
    private _value: string = "";
    private font?: Font;
    private fontTexture?: ImageBitmap;
    private model?: TextModel;
    private viewer?: TextViewer;
    private controller?: TextController;

    private textStyle?: CSSStyleDeclaration;
    private selectStyle?: CSSStyleDeclaration;
    private whitespaceStyle?: CSSStyleDeclaration;
    // The margin around the cursor to try and keep visible when scrolling
    private scrollMargin = {left: 1, right: 1, top: 1, bottom: 1};
    
    // A select operation is currently in progress (between mousedown and mouseup)
    private selecting = false;
    // A drag operation (with us as the source) is in progress (between dragstart and dragend)
    private dragging = false;
    // Whether we draw helpers for whitespace characters
    private showWhitespace = false;
    
    // HTMLElements used to build the shadow DOM
    private stylesheet: HTMLStyleElement;
    private canvas: HTMLCanvasElement = document.createElement("canvas");
    private context = this.canvas.getContext("bitmaprenderer") as ImageBitmapRenderingContext;
    private slotElement: HTMLSlotElement;
    private spinner: HTMLSlotElement;
    private errorElement: HTMLDivElement;
    private errorMessage: HTMLParagraphElement;
    private container: HTMLDivElement;
    constructor() {
        super();
        this.attachShadow({mode: "open"});
        // Maybe this should be done with an innerHTML'd template
        // and clone, then pick the nodes out with querySelector()
        
        this.stylesheet = document.createElement("style");
        this.stylesheet.innerHTML = STYLESHEET;
        this.container = document.createElement("div");
        this.container.id = "container";

        this.slotElement = document.createElement("slot");
        
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
        return ["fontsrc", "value", "show-whitespace"];
    }
    public attributeChangedCallback(name: string, oldValue: string|null, newValue: string|null): void {
        switch(name) {
            case "fontsrc": {
                this.fontSrc = newValue || "";
                break;
            }
            case "value": {
                this._value = newValue || "";
                if(this.model) this.model.reset(this._value);
                break;
            }
            case "show-whitespace":
                // TODO: Convert to getter/setter?
                this.showWhitespace = newValue !== null;
                if(this.viewer) this.viewer.showWhitespace = this.showWhitespace;
                break;
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
            // Extract some (dynamically updated) calculated style references

            this.whitespaceStyle = getComputedStyle(this, "::cue");

            const container = this.container;

            container.appendChild(this.stylesheet);
            container.appendChild(this.canvas);
            
            container.appendChild(this.slotElement);

            container.appendChild(this.spinner);
            container.appendChild(this.errorElement);
            const whitespacePart = document.createElement("div");
            whitespacePart.setAttribute("part", "whitespace");
            whitespacePart.style.display = "none";
            container.appendChild(whitespacePart);

            this.shadowRoot?.appendChild(container);

            if(!this.fontSrc || this.fontSrc === "") {
                this.showError("Need a fontSrc");
            }
        }
    }
    public disconnectedCallback() {
        if(this.controller) this.controller.unlisten();

    }

    public get value(): string {
        return this._value;
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
            this.fontTexture = await createImageBitmap(blob);
            this.font = font;
            this.scrollMargin = {
                left: this.font.maxWidth * 2,
                right: this.font.maxWidth,
                top: 0,
                bottom: this.font.lineHeight * 2
            };            
            this.spinner.hidden = true;
            if(this.model) this.model.setFont(this.font);
            else this.model = new TextModel(this.font, this._value);
            if(this.viewer) this.viewer.setFont(this.font, this.fontTexture);
            else {
                this.viewer = new TextViewer(this.model, this.font, this.fontTexture, this.context, this.textStyle!, this.selectStyle!);
                this.viewer.showWhitespace = this.showWhitespace;
            }
            if(!this.controller) {
                this.controller = new TextController(this, this.model, this.viewer);
                this.controller.listen();
            }
        } catch(e) {
            console.error(e);
            this.showError("Error loading");
        }
    }
}
export function installWebComponent() {
    if(!customElements.get("text-editor")) {
        customElements.define('text-editor', HTMLTextEditorElement);
    }
}
installWebComponent();
