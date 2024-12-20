/**
 * Doc information for macro documents
 */
import { Bytes, DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SetOptions, SnapshotOptions, WithFieldValue } from "firebase/firestore";
import { OwnFields, Store, Update, UserDoc } from './UserDocStore';
import TextView from "../../texteditor/TextView";
import { TextModel } from "../../texteditor/TextModel";

import axis12 from "../../res/axis-12-lobby-combined.json?url";
import { loadFont } from "../../texteditor/Font";

export interface MacroDoc extends UserDoc {
    name: string;
    text: string;
    thumbnail: Bytes;
};

export enum MacroSortKeys {
    updated = "updated",
    name = "name"
}
export class MacroStore extends Store<MacroDoc> {

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
            this.view = new TextView(this.model, font, fontTexture, this.context, {}, {});
            
        }).catch((reason: unknown) => {
            console.error("Unable to load font", reason);
        })
    }
    protected constructOwnFields(): OwnFields<MacroDoc> {
        return {
            text: "",
            thumbnail: Bytes.fromBase64String("")
        }
    }
    protected hasChangedOwnFields(a: OwnFields<MacroDoc>, b: OwnFields<MacroDoc>): boolean {
        return a.text !== b.text;
    }
    fromFirestore(snapshot: QueryDocumentSnapshot, _options?: SnapshotOptions): MacroDoc {
        const {owner, name, text, created, updated, thumbnail, deleted} = snapshot.data();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        return {id: snapshot.id, owner, name, text, created, updated, thumbnail, deleted};
    }
    toFirestore(macro: WithFieldValue<MacroDoc>): DocumentData {
        const {owner, name, text, created, updated, thumbnail, deleted} = macro;
        return {owner, name, text, created, updated, thumbnail, deleted};
    }

    public async presave(document: Update<MacroDoc>): Promise<Update<MacroDoc>> {
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
