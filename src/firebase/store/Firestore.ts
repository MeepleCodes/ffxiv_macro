import {app} from '../Firebase';
import { auth } from '../auth/FirebaseAuth';
import { Bytes, Timestamp, collection, doc, DocumentData, DocumentReference, FirestoreDataConverter, getDoc, getDocs, getFirestore, onSnapshot, query, QueryDocumentSnapshot, SnapshotOptions, Unsubscribe, where, WithFieldValue, updateDoc, serverTimestamp, addDoc, orderBy } from "firebase/firestore";
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
            thumbnail: d.thumbnail
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
    async loadAll(): Promise<MacroDoc[]> {
        return getDocs(query(macros, where("owner", "==", auth.currentUser?.uid)).withConverter(MacroConverter)).then((snapshot) => {
            return snapshot.docs.filter(snap => snap.exists()).map(snap=>snap.data());
        });
    },
    watchAll(callback: (docs: MacroDoc[])=> void, sort?: Sort): Unsubscribe {
        let q;
        if(sort !== undefined) {
            q = query(macros, where("owner", "==", auth.currentUser?.uid), orderBy(sort.key, sort.ascending ? "asc" : "desc"));
        } else {
            q = query(macros, where("owner", "==", auth.currentUser?.uid));
        }
        return onSnapshot(q.withConverter(MacroConverter), (snapshot) => {
            callback(snapshot.docs.filter(snap => snap.exists()).map(snap=>snap.data()));
        });
    },
    async save(id: string|undefined, name: string, text: string, thumbnail: Bytes): Promise<string> {
        const ref = doc(macros, id).withConverter(MacroConverter);
        const macro = {
            name, text, thumbnail,
            updated: serverTimestamp()
        };
        console.log("Saving", macro, "to", ref.path);
        return updateDoc(ref, macro).then(() => ref.id);
    },
    async saveAs(name: string, text: string, thumbnail: Bytes): Promise<string> {
        const macro = {
            name, text, thumbnail,
            owner: auth.currentUser?.uid,
            updated: serverTimestamp(),
            created: serverTimestamp()
        };
        return await addDoc(macros, macro).then(docRef => docRef.id);
    }
};