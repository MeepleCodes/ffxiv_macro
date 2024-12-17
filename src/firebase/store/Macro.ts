/**
 * Doc information for macro documents
 */
import { Bytes, DocumentData, FirestoreDataConverter, PartialWithFieldValue, QueryDocumentSnapshot, SetOptions, SnapshotOptions, WithFieldValue } from "firebase/firestore";
import { OwnFields, Store, UserDoc } from './UserDocStore';

export interface MacroDoc extends UserDoc {
    name: string;
    text: string;
    thumbnail: Bytes;
};
const converter: FirestoreDataConverter<MacroDoc>  = {
    fromFirestore(snapshot: QueryDocumentSnapshot, _options?: SnapshotOptions): MacroDoc {
        const {owner, name, text, created, updated, thumbnail, deleted} = snapshot.data();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        return {id: snapshot.id, owner, name, text, created, updated, thumbnail, deleted};
    },
    toFirestore(macro: WithFieldValue<MacroDoc>): DocumentData {
        const {owner, name, text, created, updated, thumbnail, deleted} = macro;
        return {owner, name, text, created, updated, thumbnail, deleted};
    },
}
export enum MacroSortKeys {
    updated = "updated",
    name = "name"
}
export class MacroStore extends Store<MacroDoc> {
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
}

export const macroStore = new MacroStore("macros");
