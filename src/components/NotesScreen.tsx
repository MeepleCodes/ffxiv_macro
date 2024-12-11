import { Box, Card, CardHeader, Divider, IconButton, Paper, TextField, Tooltip } from "@mui/material";
import LoadingButton from '@mui/lab/LoadingButton';
import SaveIcon from '@mui/icons-material/Save';
import ContentSavePlus from 'mdi-material-ui/ContentSavePlus';
import FileOutline from 'mdi-material-ui/FileOutline';

import { NoteDoc, noteStore } from "../firebase/store/Notes"
import React from "react";
import { MaybeSaved } from "../firebase/store/UserDocStore";

export type NotesScreenProps = {
  doc?: NoteDoc,
  onIdChange?: (id?: string) => void,
};

export default function NotesScreen(props: NotesScreenProps) {
  const {doc: initialDoc = noteStore.new(), onIdChange} = props;
  // Flag set when load/save operations are in progress; don't allow any others
  // to run at the same time
  const [busy, setBusy] = React.useState(false);
  
  // The last saved document (so we know if we have unsaved changes)
  const [savedDoc, setSavedDoc] = React.useState<MaybeSaved<NoteDoc>>(initialDoc);
  // The live edited version of the document, updated whenever inputs change
  const [doc, setDoc] = React.useState<MaybeSaved<NoteDoc>>(initialDoc);
  // Whether doc and savedDoc are the same
  const dirty = (doc.name !== savedDoc.name || doc.body !== savedDoc.body);
  // Trigger the onIdChange callback whenever savedDoc.id changes
  React.useEffect(() => {
    if(savedDoc.id !== initialDoc.id) onIdChange?.(savedDoc.id)
  }, [savedDoc.id, initialDoc, onIdChange]);
  const handleNew = () => {
    // TODO: Confirmation dialog
    const newNote = noteStore.new();
    setSavedDoc(newNote);
    setDoc(newNote);
  }
  const handleSave = () => {
    const savingDoc = doc;
    setBusy(true);
    noteStore.save(savingDoc.id, savingDoc).then((newId: string) => {
      // Replace just the ID in the live document, as the contents might
      // have changed while the save was running
      setDoc((doc) => ({...doc, id: newId}));
      // But replace the last-saved document with whatever we actually wrote
      setSavedDoc({...savingDoc, id: newId});
      setBusy(false);
    }).catch((e: unknown) => {
      console.error("Error saving", e);
      setBusy(false);
    });
  }
  const handleSaveCopy = () => {
    const savingDoc = doc;
    setBusy(true);
    noteStore.saveAs(savingDoc).then((newId: string) => {
      // Replace just the ID in the live document, as the contents might
      // have changed while the save was running
      setDoc((doc) => ({...doc, id: newId}));
      // But replace the last-saved document with whatever we actually wrote
      setSavedDoc({...savingDoc, id: newId});
      setBusy(false);
    }).catch((e: unknown) => {
      console.error("Error saving", e);
      setBusy(false);
    });
  }  
  return <>
    <Box sx={{
      // mt: -6,
      p: 0,
      m: 1,
      gridArea: "toolbar",
      // position: "fixed",
      display: "flex",
      gap: 1,
    }}>
      <LoadingButton
        color="primary"
        size="small"
        onClick={handleNew}
        loading={busy}
        startIcon={<FileOutline />}
        loadingPosition="start"
        variant="outlined"
      >
        New
      </LoadingButton>
      <TextField
        value={doc.name}
        onChange={(e) => {setDoc(doc => ({...doc, name: e.target.value}))}}
        placeholder="Give your note a name"
        variant="outlined"
        color="primary"
        size="small"
      />
      <LoadingButton
        color="primary"
        disabled={!dirty}
        loading={busy}
        onClick={handleSave}
        startIcon={<SaveIcon/>}
        loadingPosition="start"
        variant="outlined"
      >
        Save
      </LoadingButton>
      <LoadingButton
        color="primary"
        loading={busy}
        disabled={doc.name === "" && doc.body === ""}
        onClick={handleSaveCopy}
        startIcon={<ContentSavePlus/>}
        loadingPosition="start"
        variant="outlined"
      >
        Save a copy
      </LoadingButton>
    </Box>
    <Card sx={{m: 1, mt: 0, display: "flex", flexDirection: "column", gridArea: "main"}}>
      <textarea style={{flex: 1, resize: "none", padding: 4, borderRadius: 4, backgroundColor: "transparent" }} value={doc.body} onChange={(e) => {setDoc((doc) => ({...doc, body: e.target.value}))}}/>
    </Card>
  </>
}