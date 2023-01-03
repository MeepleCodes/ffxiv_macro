import { Font } from "./Font";

export default class HTMLTextEditorElement extends HTMLElement implements EventListenerObject {
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
    private font?: Font;
    private fontTexture?: ImageBitmap;
    private textStyle?: CSSStyleDeclaration;
    private selectStyle?: CSSStyleDeclaration;
    private whitespaceStyle?: CSSStyleDeclaration;
    // The margin around the cursor to try and keep visible when scrolling
    private scrollMargin = {left: 1, right: 1, top: 1, bottom: 1};
    // Interval between caret on/off, in ms
    private blinkInterval = 500;
    // Whether the caret is currently blinking (meaning invisible)
    private blink = false;
    // Whether the editor has focus; the caret isn't shown if not
    private hasFocus = false;
    // Reference for the setInterval return used to control the caret blink
    private intervalRef: ReturnType<typeof setInterval> | null = null;

    // A select operation is currently in progress (between mousedown and mouseup)
    private selecting = false;
    // A drag operation (with us as the source) is in progress (between dragstart and dragend)
    private dragging = false;
    // Whether we draw helpers for whitespace characters
    private showWhitespace = false;
    
    // HTMLElements used to build the shadow DOM
    protected stylesheet: HTMLStyleElement;
    protected canvas: HTMLCanvasElement = document.createElement("canvas");
    protected context = this.canvas.getContext("bitmaprenderer") as ImageBitmapRenderingContext;
    protected slotElement: HTMLSlotElement;
    protected spinner: HTMLSlotElement;
    protected errorElement: HTMLDivElement;
    protected errorMessage: HTMLParagraphElement;
    protected container: HTMLDivElement;
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
                this.text.reset(newValue || "");
                if(this.isReady()) this.postUpdate();
                break;
            }
            case "show-whitespace":
                this.showWhitespace = newValue !== null;
                if(this.isReady()) this.postUpdate();
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
            this.textStyle = getComputedStyle(this);
            this.selectStyle = getComputedStyle(this, "::selection");
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

            this.slotElement.addEventListener("slotchange", this);

            for(const [event, eventMap] of Object.entries(EVENT_MAP)) {
                eventMap.source(this).addEventListener(event, this);
            }
            if(!this.fontSrc || this.fontSrc === "") {
                this.showError("Need a fontSrc");
            }
        }
    }
    public disconnectedCallback() {
        if(this.intervalRef) clearInterval(this.intervalRef);
        for(const [event, eventMap] of Object.entries(EVENT_MAP)) {
            eventMap.source(this).removeEventListener(event, this);
        }

    }
    public handleEvent(e: Event) : void {
        const map = EVENT_MAP[e.type as keyof EventMap];
        if(map !== undefined && (this.isReady() || !map.requiresReady)) {
            (map.handler as any).call(this, e as any as keyof HTMLElementEventMap);
        }
    }
}