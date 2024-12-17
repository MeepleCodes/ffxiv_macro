/**
 * Doc information for Note documents
 */
import { Store, UserDoc } from "./UserDocStore";
import { WithFieldValue, QueryDocumentSnapshot, SnapshotOptions, DocumentData } from "firebase/firestore";

export interface NoteDoc extends UserDoc {
  body: string;
}

class NoteStore extends Store<NoteDoc> {
  fromFirestore(snapshot: QueryDocumentSnapshot, _options?: SnapshotOptions): NoteDoc {
    const {owner, created, updated, deleted, name, body } = snapshot.data();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return {id: snapshot.id, owner, created, updated, deleted, name, body };
  }
  toFirestore(note: WithFieldValue<NoteDoc>): DocumentData {
    const {owner, created, updated, deleted, name, body } = note;
      return {owner, created, updated, deleted, name, body};
  }
  protected constructOwnFields(): Omit<NoteDoc, keyof UserDoc> {
      return {body: ""}
  }
  protected hasChangedOwnFields(before: NoteDoc, after: NoteDoc): boolean {
      return before.body !== after.body;
  }

} 
export const noteStore = new NoteStore("notes");