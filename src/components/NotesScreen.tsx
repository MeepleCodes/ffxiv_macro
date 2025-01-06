import { Card } from "@mui/material";

import { NoteDoc, noteStore } from "../firebase/store/Notes"
import React from "react";
import DocToolbar from "./DocToolbar";

export type NotesScreenProps = {
  doc?: NoteDoc,
  onIdChange?: (id?: string) => void,
};

export default function NotesScreen(props: NotesScreenProps) {
  const {doc = noteStore.new(), onIdChange} = props;
  const [liveDoc, setLiveDoc] = React.useState(doc);
  return <>
    <DocToolbar
      liveDoc={liveDoc}
      setLiveDoc={setLiveDoc}
      onIdChange={onIdChange}
      store={noteStore}
      sx={{
      p: 0,
      m: 1,
    }}/>

    <Card sx={{m: 1, mt: 0, display: "flex", flexDirection: "column", gridArea: "main"}}>
      <textarea style={{flex: 1, resize: "none", padding: 4, borderRadius: 4, backgroundColor: "transparent" }} value={liveDoc.body} onChange={(e) => {setLiveDoc((doc) => ({...doc, body: e.target.value}))}}/>
    </Card>
  </>
}