import { addDoc, collection, CollectionReference, doc, DocumentData, Firestore, FirestoreDataConverter, getDoc, getFirestore, onSnapshot, orderBy, OrderByDirection, PartialWithFieldValue, query, QueryConstraint, QueryDocumentSnapshot, serverTimestamp, SetOptions, SnapshotOptions, Timestamp, Unsubscribe, updateDoc, where, WithFieldValue } from "firebase/firestore";
import React from "react";
import { app } from "../Firebase";
import { auth, useCurrentUser } from "../auth/FirebaseAuth";
import { format } from "date-fns/format";

export type UserDoc<OwnFields> = OwnFields & {
  id: string;
  owner?: string;
  name: string;
  created: Timestamp|null;
  updated: Timestamp|null;
  deleted: boolean;  
}
/** An update to a user document, which may change the name but no other UserDoc fields */
export type Update<OwnFields> = OwnFields & { name: string };
/** An unsaved UserDoc which has a name and may have an ID */
export type Unsaved<OwnFields> = OwnFields & {id?: string, name: string};
/** A document that may or may not have been saved yet */
export type MaybeSaved<OwnFields> = Unsaved<OwnFields> | UserDoc<OwnFields>;

export type Sort<OwnFields> = {
  key: keyof UserDoc<OwnFields> & string,
  direction?: OrderByDirection
}

export function updated(doc: UserDoc<unknown>) {
  return doc.updated ? 
      format(doc.updated.toDate(), "PPpp") :
      "No modified date/time"
}

/**
 * Store for arbitrary document types with some common fields.
 */
export abstract class Store<OwnFields> implements FirestoreDataConverter<UserDoc<OwnFields>> {
  private db: Firestore;
  private collection: CollectionReference<UserDoc<OwnFields>>;
  constructor(
    collectionName: string
  ) {
    this.db = getFirestore(app);
    this.collection = collection(this.db, collectionName).withConverter<UserDoc<OwnFields>>(this);
  }
  
  protected abstract constructOwnFields(): OwnFields;
  protected abstract hasChangedOwnFields(a: OwnFields, b: OwnFields): boolean;
  abstract toFirestore(modelObject: WithFieldValue<UserDoc<OwnFields>>): WithFieldValue<DocumentData>;
  abstract toFirestore(modelObject: PartialWithFieldValue<UserDoc<OwnFields>>, options: SetOptions): PartialWithFieldValue<DocumentData>;
  abstract toFirestore(modelObject: unknown, options?: unknown): WithFieldValue<DocumentData> | PartialWithFieldValue<DocumentData>;
  abstract fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): UserDoc<OwnFields>;

  /**
   * Create a new, unsaved document
   * @returns A new, blank document
   */
  public new(): Unsaved<OwnFields> {
    return {...this.constructOwnFields(), id: undefined, name: ""};
  }
  
  /**
   * Compare if two documents have changed, ignoring meta-data fields (id,
   * creation/update time etc). Name is not ignored, but ID is.
   * @param a 
   * @param b 
   * @returns 
   */
  public hasChanged(a: MaybeSaved<OwnFields>, b: MaybeSaved<OwnFields>) {
    return a.name !== b.name || this.hasChangedOwnFields(a, b);
  }
  
  /**
   * Doing any pre-save processing, such as generating thumbnails.
   * Default implementation does nothing.
   */
  public async presave(document: Update<OwnFields>): Promise<Update<OwnFields>> {
    return Promise.resolve(document);
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
  public async save(id: string|undefined, document: Update<OwnFields>): Promise<string> {
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
  public async saveAs(document: Update<OwnFields>): Promise<string> {
    const docRef = await addDoc(
      this.collection,
      Object.assign(
        document,
        {
          owner: auth.currentUser?.uid,
          updated: serverTimestamp(),
          created: serverTimestamp(),
          deleted: false
        }
      ) as WithFieldValue<UserDoc<OwnFields>>
    );
    // Even fixing the typing, this still breaks because WithFieldValue doesn't accept serverTimestamp() as a WithFieldValue<Timestamp>?


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
  public async load(id: string, includeDeleted = false): Promise<UserDoc<OwnFields>|null> {
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

  /**
   * Watch function used by the useWatchOwnDocs() hook. Listens for changes to
   * the list of documents of this type owned by a given user.
   * 
   * @param uid User to watch for
   * @param callback Update function, will be called whenever the list of docs changes
   * @param sortBy Sort criteria (if any)
   * @param includeDeleted Include documents marked as deleted (default: false)
   * @returns Unsubscribe function, call when updates are no longer required
   */
  public watchOwn(uid: string|undefined, callback: (docs: UserDoc<OwnFields>[]) => void, sortBy: Sort<OwnFields>[], includeDeleted = false): Unsubscribe {
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
export function useWatchOwnDocs<OwnFields>(store: Store<OwnFields>, sortBy: Sort<OwnFields>[] = [], includeDeleted = false, filter?: string): UserDoc<OwnFields>[] {
  const uid = useCurrentUser()?.uid;
  const [docs, setDocs] = React.useState<UserDoc<OwnFields>[]>([]);
  React.useEffect(() => {
    const unsubscribe = store.watchOwn(uid, 
      (docs) => {
        setDocs(docs);
      },
      sortBy,
      includeDeleted
    );
    return () => {
        unsubscribe();
    }    
  }, [uid, store, sortBy, setDocs, includeDeleted]);
  if(filter !== undefined && filter !== "") {
    const lCaseFilter = filter.toLowerCase();
    return docs.filter(doc => doc.name.toLowerCase().includes(lCaseFilter));
  } else {
    return docs;
  }
}