import React from "react";
import dayjs, { Dayjs } from "dayjs";
import { Database, Tables, TablesUpdate } from "./database.types";
import supabase from "./client";
import { useSession } from "./auth";

export type UserDoc<OwnFields> = OwnFields & {
  id: string;
  owner?: string;
  name: string;
  created: Dayjs|null;
  updated: Dayjs|null;
  deleted: boolean;  
}
/** An update to a user document, which may change the name but no other UserDoc fields */
export type Update<OwnFields> = OwnFields & { name: string };
/** An unsaved UserDoc which has a name and may have an ID */
export type Unsaved<OwnFields> = OwnFields & {id?: string, name: string};
/** A document that may or may not have been saved yet */
export type MaybeSaved<OwnFields> = Unsaved<OwnFields> | UserDoc<OwnFields>;

export type SortDirection = "asc" | "desc";

export type Sort<OwnFields> = {
  key: keyof UserDoc<OwnFields> & string,
  direction?: SortDirection
}

export function updated(doc: UserDoc<unknown>) {
  return doc.updated?.format("lll") ?? "No modified date/time";
}

type DocTable = {
  Row: {
    created: string | null
    deleted: boolean
    id: number
    name: string
    owner: string | null
    updated: string | null
  }
}

type DocTables = {
  [key in keyof Database["public"]["Tables"] as Database["public"]["Tables"][key] extends DocTable ? key : never]: Database["public"]["Tables"][key]
}



/**
 * Store for arbitrary document types with some common fields.
 */
export abstract class Store<OwnFields, PreProcessed = OwnFields, Table extends DocTables[keyof DocTables] = DocTables[keyof DocTables]> {
  constructor(
    public readonly tableName: keyof DocTables
  ) {}
  
  protected abstract constructOwnFields(): OwnFields;
  protected abstract hasChangedOwnFields(a: OwnFields, b: OwnFields): boolean;
  protected abstract ownFieldsFromRow(row: Table["Row"]): OwnFields;
  protected abstract ownFieldsToRow(doc: PreProcessed): Omit<Table["Insert"], "name">;

  private fromDb(row: Table["Row"]): UserDoc<OwnFields> {
    return {
      name: row.name,
      owner: row.owner ?? undefined,
      updated: dayjs(row.updated),
      created: dayjs(row.created),
      deleted: row.deleted,
      id: row.short_id,
      ...this.ownFieldsFromRow(row)
    };
  }

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
  protected abstract presave(document: Update<OwnFields>): Promise<Update<PreProcessed>>;

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
      const preProcessed = await this.presave(document);
      const response = await supabase
        .from(this.tableName)
        .update({
          ...this.ownFieldsToRow(preProcessed),
          name: document.name,
          updated: new Date().toISOString()
        })
        .eq("short_id", id)
        .select("short_id");
      if(response.error !== null) throw response.error;
      return response.data[0].short_id;
    }
  }
  /**
   * Save a document under a new ID
   * 
   * @param document Document body to save
   * @returns The ID of the new document
   */
  public async saveAs(document: Update<OwnFields>): Promise<string> {
    
    // Even fixing the typing, this still breaks because WithFieldValue doesn't
    // accept serverTimestamp() as a WithFieldValue<Timestamp>?
    const preProcessed = await this.presave(document);
    const user = await supabase.auth.getUser();
    if(user.error) throw user.error;
    const uid = user.data.user.id;
    const response = await supabase
      .from(this.tableName)
      .insert({
        ...this.ownFieldsToRow(preProcessed),
        name: document.name,
        owner: uid,
        updated: new Date().toISOString()
      })
      .select("short_id");
    if(response.error !== null) throw response.error;
    return response.data[0].short_id;
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
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("short_id", id);
    if(!includeDeleted) {
      query = query.eq("deleted", false);
    }
    const response = await query
      .maybeSingle();
    if(response.error !== null) throw response.error;
    if(response.data === null) return null;
    return this.fromDb(response.data);
  }

  /**
   * Mark a documented as deleted (by setting the deleted flag, but not actually
   * deleting it).
   * 
   * @param id Document ID
   */
  public async markDeleted(id: string): Promise<void> {
    await supabase
      .from(this.tableName)
      .update({deleted: true})
      .eq("short_id", id);
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
  public watchOwn(uid: string|undefined, callback: (docs: UserDoc<OwnFields>[]) => void, sortBy: Sort<OwnFields>[], includeDeleted = false): () => void {

    // If there's no current user, the result will always be the empty list and
    // there's no subscription so just set that now and return a dummy
    // unsubscribe.
    if(uid === undefined) {
      console.log("No user to watch, returning empty list");
      callback([]);
      return () => {};
    }
    const filters: string[] = [
      
    ];
    if(!includeDeleted) {
      filters.push("deleted=eq.false");
    }
    const fetchDocs = () => {
      let query = supabase
        .from(this.tableName)
        .select("*")
        .eq("owner", uid);
      if(!includeDeleted) {
        query = query.eq("deleted", false);
      }
      for(const sort of sortBy) {
        query = query.order(sort.key, {ascending: sort.direction === "asc"})
      };
      query.then(
        (result) => {
          if(result.error !== null) throw result.error;
          callback(result.data.map(row => this.fromDb(row)))
        },
        (error: unknown) => {
          throw error;
        }
      );
    };
    const updates = supabase
      .channel(`public-db-${this.tableName}-changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          tableName: this.tableName,
          filter: `owner=eq.${uid}`
        },
        fetchDocs
      )
      .subscribe((status, err) => {
        console.log("Subscription to postgres changes:", status);
        if(err) console.error("Failed to subscribe to table updates", err);
      });
    fetchDocs();
    return () => {
      void updates.unsubscribe;
    }
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
export function useWatchOwnDocs<OwnFields, SaveFields, Table extends DocTables[keyof DocTables]>(store: Store<OwnFields, SaveFields, Table>, sortBy?: Sort<OwnFields>[], includeDeleted?: boolean, filter?: string): UserDoc<OwnFields>[] {
  const uid = useSession()?.user.id;
  console.log("watching for changes to table", store.tableName, "for user", uid);
  const [docs, setDocs] = React.useState<UserDoc<OwnFields>[]>([]);
  React.useEffect(() => {
    const unsubscribe = store.watchOwn(uid, 
      (docs) => {
        setDocs(docs);
      },
      sortBy ?? [],
      includeDeleted ?? false
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