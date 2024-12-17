/**
 * Doc information for macro documents
 */
import { Bytes, DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, WithFieldValue } from "firebase/firestore";
import { Store, UserDoc } from './UserDocStore';

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
export const macroStore = new Store<MacroDoc>(
    "macros",
    converter,
    () => ({name: "", text: "", thumbnail: Bytes.fromBase64String("")})
);
