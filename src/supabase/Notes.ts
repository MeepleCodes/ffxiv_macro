/**
 * Doc information for Note documents
 */
import { Tables, TablesInsert } from "./database.types";
import { Store, Update, UserDoc } from "./UserDocStore";

export interface NoteFields {
  body: string;
}
export type NoteDoc = UserDoc<NoteFields>;

class NoteStore extends Store<NoteFields> {
  protected async presave(document: Update<NoteFields>): Promise<Update<NoteFields>> {
    return Promise.resolve(document);
  }
  constructor() {super("notes")}
  protected ownFieldsFromRow(row: Tables<"notes">): NoteFields {
    return {
      body: row.body
    };
  }
  protected ownFieldsToRow(doc: NoteFields): Omit<TablesInsert<"notes">, "name"> {
    return {
      body: doc.body
    };
  }
  protected constructOwnFields(): NoteFields {
      return {body: ""}
  }
  protected hasChangedOwnFields(before: NoteFields, after: NoteFields): boolean {
      return before.body !== after.body;
  }

} 
export const noteStore = new NoteStore();