/**
 * Doc information for Note documents
 */
import { Store, UserDoc } from "./UserDocStore";
import { WithFieldValue, QueryDocumentSnapshot, SnapshotOptions, DocumentData } from "firebase/firestore";

export interface NoteFields {
  body: string;
}
export type NoteDoc = UserDoc<NoteFields>;

class NoteStore extends Store<NoteFields> {
  fromFirestore(snapshot: QueryDocumentSnapshot, _options?: SnapshotOptions): NoteDoc {
    const {owner, created, updated, deleted, name, body } = snapshot.data();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return {id: snapshot.id, owner, created, updated, deleted, name, body };
  }
  toFirestore(note: WithFieldValue<NoteDoc>): DocumentData {
    const {owner, created, updated, deleted, name, body } = note;
      return {owner, created, updated, deleted, name, body};
  }
  protected constructOwnFields(): NoteFields {
      return {body: ""}
  }
  protected hasChangedOwnFields(before: NoteFields, after: NoteFields): boolean {
      return before.body !== after.body;
  }

} 
export const noteStore = new NoteStore("notes");