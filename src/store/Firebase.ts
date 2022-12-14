import { initializeApp } from "firebase/app";
import { Bytes, collection, doc, DocumentData, DocumentReference, FirestoreDataConverter, getDoc, getDocs, getFirestore, query, QueryDocumentSnapshot, setDoc, SnapshotOptions, WithFieldValue } from "firebase/firestore";

// Far from perfect but at least we're not committing the keys to github
// (they're still accessible from the packed javascript)
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGE_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};


// Initialize Firebase
console.log("Initialising Firebase with appId", firebaseConfig.appId);
const app = initializeApp(firebaseConfig);


// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
const macros = collection(db, "macros");

export interface MacroDoc {
    id: string | undefined;
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
            name: d.name,
            text: d.text,
            draft: d.draft,
            thumbnail: d.thumbnail
        }
    },
    toFirestore(macro: WithFieldValue<MacroDoc>): DocumentData {
        return {name: macro.name, text: macro.text, draft: macro.draft, thumbnail: macro.thumbnail}
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
        return getDocs(query(macros).withConverter(MacroConverter)).then((snapshot) => {
            return snapshot.docs.filter(snap => snap.exists()).map(snap=>snap.data());
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