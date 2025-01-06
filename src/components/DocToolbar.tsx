import React from "react";
import { MaybeSaved, Store, UserDoc } from "../firebase/store/UserDocStore";
import LoadingButton from "@mui/lab/LoadingButton";
import SaveIcon from '@mui/icons-material/Save';
import ContentSavePlus from 'mdi-material-ui/ContentSavePlus';
import FileOutline from 'mdi-material-ui/FileOutline';
import { Box, BoxProps, Stack, TextField } from "@mui/material";

export type DocToolbarProps<T> = {
  store: Store<T>,
  liveDoc: MaybeSaved<T>,
  setLiveDoc: React.Dispatch<React.SetStateAction<MaybeSaved<T>>>,
  onIdChange?: (id?: string) => void,
  namePlaceholder?: string
} & BoxProps;

export default function DocToolbar<OwnFields>(props: DocToolbarProps<OwnFields>) {
  const {
    store, liveDoc, setLiveDoc, onIdChange, namePlaceholder,
    ...boxProps
  } = props;
  // Flag set when load/save operations are in progress; don't allow any others
  // to run at the same time
  const [busy, setBusy] = React.useState(false);
  
  // The last saved document (so we know if we have unsaved changes)
  const [savedDoc, setSavedDoc] = React.useState<MaybeSaved<OwnFields>>(liveDoc);
  // The live edited version of the document, updated whenever inputs change
  // Whether doc and savedDoc are the same
  const dirty = store.hasChanged(liveDoc, savedDoc);
  // Trigger the onIdChange callback whenever savedDoc.id changes
  React.useEffect(() => {
    if(savedDoc.id !== liveDoc.id) onIdChange?.(savedDoc.id)
  }, [savedDoc.id, liveDoc.id, onIdChange]);
  const handleNew = () => {
    // TODO: Confirmation dialog
    const newNote = store.new();
    setSavedDoc(newNote);
    setLiveDoc(newNote);
  }
  const handleSave = () => {
    const savingDoc = liveDoc;
    setBusy(true);
    store.save(savingDoc.id, savingDoc).then((newId: string) => {
      // Replace just the ID in the live document, as the contents might
      // have changed while the save was running
      setLiveDoc((doc) => ({...doc, id: newId}));
      // But replace the last-saved document with whatever we actually wrote
      setSavedDoc({...savingDoc, id: newId});
      setBusy(false);
    }).catch((e: unknown) => {
      console.error("Error saving", e);
      setBusy(false);
    });
  }
  const handleSaveCopy = () => {
    const savingDoc = liveDoc;
    setBusy(true);
    store.saveAs(savingDoc).then((newId: string) => {
      // Replace just the ID in the live document, as the contents might
      // have changed while the save was running
      setLiveDoc((doc) => ({...doc, id: newId}));
      // But replace the last-saved document with whatever we actually wrote
      setSavedDoc({...savingDoc, id: newId});
      setBusy(false);
    }).catch((e: unknown) => {
      console.error("Error saving", e);
      setBusy(false);
    });
  }
  return (
    <Box {...boxProps}>
      <Stack gap={1} direction="row" alignItems="center">
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
          value={liveDoc.name}
          onChange={(e) => {setLiveDoc(doc => ({...doc, name: e.target.value}))}}
          placeholder={namePlaceholder}
          variant="outlined"
          color="primary"
          size="small"
          sx={{
            "& .MuiInputBase-input": {
              py: 0.5
            }
          }}
        />
        <LoadingButton
          color="primary"
          disabled={!dirty}
          loading={busy}
          onClick={handleSave}
          startIcon={<SaveIcon/>}
          loadingPosition="start"
          variant="outlined"
          size="small"
        >
          Save
        </LoadingButton>
        <LoadingButton
          color="primary"
          loading={busy}
          // disabled={}
          onClick={handleSaveCopy}
          startIcon={<ContentSavePlus/>}
          loadingPosition="start"
          variant="outlined"
          size="small"
        >
          Save a copy
        </LoadingButton>
      </Stack>
    </Box>    
  )
}