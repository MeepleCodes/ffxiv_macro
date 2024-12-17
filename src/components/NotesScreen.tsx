import { Box, Card, TextField } from "@mui/material";
import LoadingButton from '@mui/lab/LoadingButton';
import SaveIcon from '@mui/icons-material/Save';
import ContentSavePlus from 'mdi-material-ui/ContentSavePlus';
import FileOutline from 'mdi-material-ui/FileOutline';

import { NoteDoc, noteStore } from "../firebase/store/Notes"
import React from "react";
import DocToolbar from "./DocToolbar";

export type NotesScreenProps = {
  doc?: NoteDoc,
  onIdChange?: (id?: string) => void,
};

export default function NotesScreen(props: NotesScreenProps) {
  const {doc: initialDoc = noteStore.new(), onIdChange} = props;
  const [liveDoc, setLiveDoc] = React.useState(initialDoc);
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