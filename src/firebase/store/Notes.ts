/**
 * Doc information for Note documents
 */
import { Store, UserDoc } from "./UserDocStore";
import { QueryDocumentSnapshot, DocumentData, WithFieldValue, PartialWithFieldValue } from "firebase/firestore";

export interface NoteFields {
  body: string;
}
export type NoteDoc = UserDoc<NoteFields>;

class NoteStore extends Store<NoteFields> {
  getOwnFieldsFromFirestore(snapshot: QueryDocumentSnapshot): NoteFields {
    const { body } = snapshot.data();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { body };
  }
  setOwnFieldsToFirestore(doc: PartialWithFieldValue<NoteFields>): DocumentData {
    const { body } = doc;
    return { body };
  }
  protected constructOwnFields(): NoteFields {
      return {body: ""}
  }
  protected hasChangedOwnFields(before: NoteFields, after: NoteFields): boolean {
      return before.body !== after.body;
  }

} 
export const noteStore = new NoteStore("notes");