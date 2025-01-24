/**
 * Doc information for macro documents
 */
import { Json, Tables, TablesInsert } from './database.types';
import { Store, Update, UserDoc } from './UserDocStore';

export type PlanDoc = UserDoc<PlanFields>;
export interface PlanFields {
    plan: unknown; // TODO: Type this, zod loading
    thumbnail_b64: string;
};

export enum MacroSortKeys {
    updated = "updated",
    name = "name"
}

interface PlanSavedFields {
    plan: Json;
    thumbnail_bytea: string | null;
}

export class PlanStore extends Store<PlanFields, PlanSavedFields> {

    constructor() {
        super("plans");
    }
    protected constructOwnFields(): PlanFields {
        return {
            plan: {},
            thumbnail_b64: ""
        }
    }
    protected hasChangedOwnFields(a: PlanFields, b: PlanFields): boolean {
        return a.plan !== b.plan;
    }
    protected ownFieldsFromRow(row: Tables<"plans">): PlanFields {
        return {
            plan: row.plan,
            thumbnail_b64: row.thumbnail_base64 ?? ""
        }
    }
    protected ownFieldsToRow(doc: PlanSavedFields): Omit<TablesInsert<"plans">, 'name'> {
        return {
            plan: doc.plan,
            thumbnail: doc.thumbnail_bytea
        }
    }

    public async presave(document: Update<PlanFields>): Promise<Update<PlanSavedFields>> {
        // TODO: Thumbnails
        return Promise.resolve({
            ...document,
            plan: document.plan as Json,
            thumbnail_bytea: null
        });
    }
}

export const planStore = new PlanStore();
