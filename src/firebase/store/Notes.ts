import React from "react";
import { Store, UserDoc } from "./UserDocStore";
import { FirestoreDataConverter, WithFieldValue, QueryDocumentSnapshot, SnapshotOptions, DocumentData } from "firebase/firestore";

export interface NoteDoc extends UserDoc {
  name: string;
  body: string;
}

/**
 * Converter. There's no type conversion but this ensures we don't save excess
 * fields.
 */
const converter: FirestoreDataConverter<NoteDoc> = {
  fromFirestore(snapshot: QueryDocumentSnapshot, _options?: SnapshotOptions): NoteDoc {
      const {owner, created, updated, deleted, name, body } = snapshot.data();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return {id: snapshot.id, owner, created, updated, deleted, name, body };
  },
  toFirestore(note: WithFieldValue<NoteDoc>): DocumentData {
    const {owner, created, updated, deleted, name, body } = note;
      return {owner, created, updated, deleted, name, body};
  },
}

export const noteStore = new Store<NoteDoc>("notes", converter, () => ({name: "", body: ""}));