import {app} from '../Firebase';
import { auth } from '../auth/FirebaseAuth';
import { Bytes, collection, doc, DocumentData, DocumentReference, FirestoreDataConverter, getDoc, getDocs, getFirestore, onSnapshot, query, QueryDocumentSnapshot, setDoc, SnapshotOptions, Unsubscribe, where, WithFieldValue } from "firebase/firestore";
// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
const macros = collection(db, "macros");

export interface MacroDoc {
    id: string | undefined;
    owner: string;
    /** An empty name is the 'new document' draft */
    name: string;
    text: string;
    draft: boolean;
    thumbnail: Bytes;
};
const MacroConverter: FirestoreDataConverter<MacroDoc>  = {
    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options?: SnapshotOptions): MacroDoc {
        const d = snapshot.data();
        return {
            id: snapshot.id,
            owner: d.owner,
            name: d.name,
            text: d.text,
            draft: d.draft,
            thumbnail: d.thumbnail
        }
    },
    toFirestore(macro: WithFieldValue<MacroDoc>): DocumentData {
        return {name: macro.name, text: macro.text, draft: macro.draft, thumbnail: macro.thumbnail, owner: macro.owner}
    },
}

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
    async loadAll(): Promise<MacroDoc[]> {
        return getDocs(query(macros, where("owner", "==", auth.currentUser?.uid)).withConverter(MacroConverter)).then((snapshot) => {
            return snapshot.docs.filter(snap => snap.exists()).map(snap=>snap.data());
        });
    },
    watchAll(callback: (docs: MacroDoc[])=> void): Unsubscribe {
        return onSnapshot(query(macros, where("owner", "==", auth.currentUser?.uid)).withConverter(MacroConverter), (snapshot) => {
            callback(snapshot.docs.filter(snap => snap.exists()).map(snap=>snap.data()));
        });
    },
    async save(id: string|undefined, macro: MacroDoc): Promise<string> {
        const ref = (id === undefined ? doc(macros) : doc(macros, id)).withConverter(MacroConverter);
        console.log(id === undefined ? "Saving copy of " : "Saving", macro, "to", ref.path);
        return setDoc(ref, macro).then(() => ref.id);
    },
    async saveNew(macro: MacroDoc): Promise<string> {
        return this.save(undefined, macro);
    }
};