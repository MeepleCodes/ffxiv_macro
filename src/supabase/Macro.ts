/**
 * Doc information for macro documents
 */
import { Tables, TablesInsert } from '../supabase/database.types';
import { Store, toBytea, Update, UserDoc } from './UserDocStore';
import TextView from "../texteditor/TextView";
import { TextModel } from "../texteditor/TextModel";

import axis12 from "../res/axis-12-lobby-combined.json?url";
import { loadFont } from "../texteditor/Font";

export type MacroDoc = UserDoc<MacroFields>;
export interface MacroFields {
    text: string;
    thumbnail_b64: string;
};

export enum MacroSortKeys {
    updated = "updated",
    name = "name"
}

interface MacroSavedFields {
    text: string;
    thumbnail_bytea: string | null;
}

export class MacroStore extends Store<MacroFields, MacroSavedFields> {

    private canvas: HTMLCanvasElement;
    private context: ImageBitmapRenderingContext;
    private view: TextView | null = null;
    private model: TextModel | null = null;

    constructor() {
        super("macros");
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
            thumbnail_b64: ""
        }
    }
    protected hasChangedOwnFields(a: MacroFields, b: MacroFields): boolean {
        return a.text !== b.text;
    }
    protected ownFieldsFromRow(row: Tables<"macros">): MacroFields {
        console.log("Loading macro from DB row, thumbnail base64 is", row.thumbnail_base64);
        return {
            text: row.body,
            thumbnail_b64: row.thumbnail_base64 ?? ""
        }
    }
    protected ownFieldsToRow(doc: MacroSavedFields): Omit<TablesInsert<"macros">, 'name'> {
        return {
            body: doc.text,
            thumbnail: doc.thumbnail_bytea
        }
    }

    public async presave(document: Update<MacroFields>): Promise<Update<MacroSavedFields>> {
        let bytea: string|null = null;
        if(this.model !== null && this.view !== null) {
            this.model.resetTo(document.text);
            const blob = await this.view.getThumbnail();
            const ab = await blob.arrayBuffer();
            bytea = toBytea(new Uint8Array(ab));
        }
        return {
            ...document,
            text: document.text,
            thumbnail_bytea: bytea
        }
    }
}

export const macroStore = new MacroStore();
