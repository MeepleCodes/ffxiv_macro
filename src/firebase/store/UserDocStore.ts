import { addDoc, collection, CollectionReference, doc, Firestore, FirestoreDataConverter, getDoc, getFirestore, onSnapshot, orderBy, OrderByDirection, query, QueryConstraint, serverTimestamp, Timestamp, updateDoc, where, WithFieldValue } from "firebase/firestore";
import React from "react";
import { app } from "../Firebase";
import { auth, useCurrentUser } from "../auth/FirebaseAuth";
import { format } from "date-fns/format";

export type UserDoc = {
  id: string;
  owner?: string;
  created: Timestamp|null;
  updated: Timestamp|null;
  deleted: boolean;  
}
export type Update<T extends UserDoc> = Omit<T, keyof UserDoc>// & Partial<UserDoc>;
export type Unsaved<T extends UserDoc> = Omit<T, keyof UserDoc> & {id?: string};
export type MaybeSaved<T extends UserDoc> = T | Unsaved<T>;
export type Sort<T extends UserDoc> = {
  key: keyof T & string,
  direction?: OrderByDirection
}

export function updated(doc: UserDoc) {
  return doc.updated ? 
      format(doc.updated.toDate(), "PPpp") :
      "No modified date/time"
}

/**
 * Store for arbitrary document types with some common fields.
 */
export class Store<T extends UserDoc> {
  private db: Firestore;
  private collection: CollectionReference<T>;
  constructor(
    collectionName: string,
    converter: FirestoreDataConverter<T>,
    private creator: () => Update<T>
  ) {
    this.db = getFirestore(app);
    this.collection = collection(this.db, collectionName).withConverter(converter);
  }

  /**
   * Create a new, unsaved document
   * @returns A new, blank document
   */
  public new(): Unsaved<T> {
    return {...this.creator(), id: undefined};
  }

  /**
   * Save a document. If ID is known, it will be saved under that ID; otherwise
   * it will be saved as a new document under a new ID (which can be found in
   * the return value).
   *
   * @param id ID of the document; if not supplied, save under a newly assigned
   * ID
   * @param document Document body to save
   * @returns The ID of the saved document.
   */
  public async save(id: string|undefined, document: Update<T>): Promise<string> {
    if(id === undefined) {
      return await this.saveAs(document);
    } else {
      const ref = doc(this.collection, id);
      await updateDoc(ref, {
        ...document,
        updated: serverTimestamp()
      });
      return ref.id;
      }
  }
  /**
   * Save a document under a new ID
   * 
   * @param document Document body to save
   * @returns The ID of the new document
   */
  public async saveAs(document: Update<T>): Promise<string> {
    const docRef = await addDoc(this.collection, {
      ...document,
      owner: auth.currentUser?.uid,
      updated: serverTimestamp(),
      created: serverTimestamp(),
      deleted: false
    } as WithFieldValue<T>);
    // Setting the optional values of Update<T> doesn't produce a T, typescript
    // still thinks "'Update<T> & { owner: string; created: Timestamp; updated:
    // Timestamp; deleted: false; }' is assignable to the constraint of type
    // 'T', but 'T' could be instantiated with a different subtype of constraint
    // 'UserDoc'.ts(2322)"
    // Until I work out the correct way to type that, just force it
    return docRef.id;
  }

  /**
   * Try and load a document, if it exists and isn't deleted (or we want to load
   * a deleted document).
   *
   * @param id Document ID to load
   * @param includeDeleted Whether to allow loading of a document marked deleted 
   * @returns The document, if it was found, otherwise null
   */
  public async load(id: string, includeDeleted = false): Promise<T|null> {
    const snapshot = await getDoc(doc(this.collection, id));
    if(!snapshot.exists()) return null;
    else if(snapshot.data().deleted && !includeDeleted) return null;
    else return snapshot.data();
  }

  /**
   * Mark a documented as deleted (by setting the deleted flag, but not actually
   * deleting it).
   * 
   * @param id Document ID
   */
  public async markDeleted(id: string): Promise<void> {
    const ref = doc(this.collection, id);
    await updateDoc(ref, {deleted: true});
  }

  public watchOwn(uid: string|undefined, callback: (docs: T[]) => void, sortBy: Sort<T>[], includeDeleted = false) {
    // If there's no current user, the result will always be the empty list and
    // there's no subscription so just set that now and return a dummy
    // unsubscribe.
    if(uid === undefined) {
      callback([]);
      return () => {};
    }
    const filters: QueryConstraint[] = [
      where("owner", "==", uid)
    ];
    if(!includeDeleted) {
      filters.push(
        where("deleted", "!=", true)
      );
    }
    for(const sort of sortBy) {
      filters.push(
        orderBy(sort.key, sort.direction)
      )
    }
    return onSnapshot(
      query(this.collection, ...filters),
      (snapshot) => {
        const docs = snapshot.docs.filter(snap => snap.exists()).map(snap=>snap.data());
        callback(docs);
      }
    );
  }
}

/**
 * React hook that watches for changes to all documents owned by the current
 * user.
 * @param store Store to watch
 * @param sortBy Sort order(s)
 * @param includeDeleted Whether to incldue deleted documents
 * @returns The latest list of documents
 */
export function useWatchOwnDocs<T extends UserDoc>(store: Store<T>, sortBy: Sort<T>[] = [], includeDeleted = false): T[] {
  const uid = useCurrentUser()?.uid;
  const [docs, setDocs] = React.useState<T[]>([]);
  React.useEffect(() => {
    const unsubscribe = store.watchOwn(uid, 
      (docs: T[]) => {
        setDocs(docs);
      },
      sortBy,
      includeDeleted
    );
    return () => {
        unsubscribe();
    }    
  }, [uid, store, sortBy, setDocs, includeDeleted]);
  return docs;
}