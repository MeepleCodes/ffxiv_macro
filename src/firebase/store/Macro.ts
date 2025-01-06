/**
 * Doc information for macro documents
 */
import { Bytes, DocumentData, QueryDocumentSnapshot, WithFieldValue } from "firebase/firestore";
import { Store, Update, UserDoc } from './UserDocStore';
import TextView from "../../texteditor/TextView";
import { TextModel } from "../../texteditor/TextModel";

import axis12 from "../../res/axis-12-lobby-combined.json?url";
import { loadFont } from "../../texteditor/Font";

export type MacroDoc = UserDoc<MacroFields>;
export interface MacroFields {
    text: string;
    thumbnail: Bytes;
};

export enum MacroSortKeys {
    updated = "updated",
    name = "name"
}
export class MacroStore extends Store<MacroFields> {

    private canvas: HTMLCanvasElement;
    private context: ImageBitmapRenderingContext;
    private view: TextView | null = null;
    private model: TextModel | null = null;

    constructor(store: string) {
        super(store);
        this.canvas = document.createElement("canvas");
        const ctx = this.canvas.getContext("bitmaprenderer");
        if(ctx === null) throw Error("Unable to get context");
        this.context = ctx;
        loadFont(axis12).then(({font, fontTexture}) => {
            this.model = new TextModel(font, "");
            this.view = new TextView(this.model, font, fontTexture, this.context);
            
        }).catch((reason: unknown) => {
            console.error("Unable to load font", reason);
        })
    }
    protected constructOwnFields(): MacroFields {
        return {
            text: "",
            thumbnail: Bytes.fromBase64String("")
        }
    }
    protected hasChangedOwnFields(a: MacroFields, b: MacroFields): boolean {
        return a.text !== b.text;
    }
    protected getOwnFieldsFromFirestore(snapshot: QueryDocumentSnapshot): MacroFields {
        const {text, thumbnail} = snapshot.data();
        // TODO: This should use Zod really
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        return {text, thumbnail};
    }
    protected setOwnFieldsToFirestore(doc: WithFieldValue<MacroFields>): DocumentData {
        const {text, thumbnail} = doc;
        return {text, thumbnail};
    }


    public async presave(document: Update<MacroFields>): Promise<Update<MacroFields>> {
        if(this.model !== null && this.view !== null) {
            this.model.resetTo(document.text);
            const blob = await this.view.getThumbnail();
            const ab = await blob.arrayBuffer();
            document.thumbnail = Bytes.fromUint8Array(new Uint8Array(ab));
        } else {
            document.thumbnail = Bytes.fromBase64String("");
        }
        return document;
    }
}

export const macroStore = new MacroStore("macros");
