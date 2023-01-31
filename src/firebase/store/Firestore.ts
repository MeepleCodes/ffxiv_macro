import {app} from '../Firebase';
import { auth } from '../auth/FirebaseAuth';
import { Bytes, Timestamp, collection, doc, DocumentData, DocumentReference, FirestoreDataConverter, getDoc, getFirestore, onSnapshot, query, QueryDocumentSnapshot, SnapshotOptions, Unsubscribe, where, WithFieldValue, updateDoc, serverTimestamp, addDoc, orderBy } from "firebase/firestore";
// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
const macros = collection(db, "macros");

export interface MacroDoc {
    id: string | undefined;
    owner: string;
    name: string;
    text: string;
    created: Timestamp;
    updated: Timestamp;
    thumbnail: Bytes;
    deleted: boolean;
};
const MacroConverter: FirestoreDataConverter<MacroDoc>  = {
    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options?: SnapshotOptions): MacroDoc {
        const d = snapshot.data();
        return {
            id: snapshot.id,
            owner: d.owner,
            name: d.name,
            text: d.text,
            created: d.created,
            updated: d.updated,
            thumbnail: d.thumbnail,
            deleted: d.deleted
        }
    },
    toFirestore(macro: WithFieldValue<MacroDoc>): DocumentData {
        return {name: macro.name, text: macro.text, created: macro.created, updated: macro.updated, thumbnail: macro.thumbnail, owner: macro.owner}
    },
}
export enum SortKeys {
    updated = "updated",
    name = "name"
}
export type Sort = {
    key: SortKeys,
    ascending: boolean
};

export const Store = {
    docRef(id: string): DocumentReference<MacroDoc> {
        return doc(macros, id).withConverter(MacroConverter);
    },
    async load(id: string): Promise<MacroDoc|null> {
        return getDoc(this.docRef(id)).then((snap) => {
            if(!snap.exists()) return null;
            else return snap.data();
        });
    },
    watchAll(callback: (docs: MacroDoc[])=> void, sort?: Sort, filterText?: string): Unsubscribe {
        // TODO: At the moment we filter the macro list client-side because we assume it'll be relatively short
        // If we want to filter server-side we need to enable one of Firebase's text-indexing extensions
        let filters = [where("owner", "==", auth.currentUser?.uid), where("deleted", "==", false)];
        // const filters = [where("owner", "==", auth.currentUser?.uid)];
        let q;
        if(sort !== undefined) {
            q = query(macros, ...filters, orderBy(sort.key, sort.ascending ? "asc" : "desc"));
        } else {
            q = query(macros, ...filters);
        }
        return onSnapshot(q.withConverter(MacroConverter), (snapshot) => {
            let docs = snapshot.docs.filter(snap => snap.exists()).map(snap=>snap.data());
            if(filterText !== undefined) {
                const lowerCase = filterText.toLowerCase();
                docs = docs.filter(macro => macro.name.toLowerCase().includes(lowerCase));
            }
            callback(docs);
        });
    },
    async save(id: string|undefined, name: string, text: string, thumbnail: Bytes): Promise<string> {
        const ref = doc(macros, id).withConverter(MacroConverter);
        const macro = {
            name, text, thumbnail,
            updated: serverTimestamp(),
            deleted: false
        };
        return updateDoc(ref, macro).then(() => ref.id);
    },
    async saveAs(name: string, text: string, thumbnail: Bytes): Promise<string> {
        const macro = {
            name, text, thumbnail,
            owner: auth.currentUser?.uid,
            updated: serverTimestamp(),
            created: serverTimestamp(),
            deleted: false
        };
        return addDoc(macros, macro).then(docRef => docRef.id);
    },
    async markDeleted(id: string): Promise<void> {
        const ref = doc(macros, id).withConverter(MacroConverter);
        return updateDoc(ref, {deleted: true});
    }
};