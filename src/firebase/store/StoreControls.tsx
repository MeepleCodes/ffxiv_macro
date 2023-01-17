import React, { createContext, createRef, RefObject, useContext, useEffect, useState } from "react";
import { MacroDoc, Store } from './Firestore';
import { HTMLTextEditorElement } from '../../texteditor/TextEditorReact'
import { Bytes, Unsubscribe } from "firebase/firestore";

import SaveIcon from '@mui/icons-material/Save';
import ContentSavePlus from 'mdi-material-ui/ContentSavePlus';

import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import InputBase from '@mui/material/InputBase';
import TextField from "@mui/material/TextField";
import { auth } from "../auth/FirebaseAuth";


const dontUseDefault = (nv: any) => {throw new Error("Don't use the default context");};

export const StoreContext = createContext<Ctx>({editor: createRef(), loading: false, setLoading: dontUseDefault, filename: "", fileid: undefined, setFilename: dontUseDefault, setFileid: dontUseDefault});

type Ctx = {
    editor: RefObject<HTMLTextEditorElement>;
    loading: boolean;
    filename: string;
    fileid?: string;
    setLoading: (newValue: boolean) => void;
    setFilename: (newValue: string) => void;
    setFileid: (newValue?: string) => void;
}

export function StoreContextProvider({editor, children}: {editor: RefObject<HTMLTextEditorElement>, children: React.ReactNode}) {
    const [loading, setLoading] = useState<boolean>(false);
    const [filename, setFilename] = useState<string>("");
    const [fileid, setFileid] = useState<string|undefined>();
    return <StoreContext.Provider value={{editor, loading, setLoading, filename, setFilename, fileid, setFileid}}>
        {children}
    </StoreContext.Provider>
}

function useSave() {
    let {fileid, editor,  setLoading, filename,  setFileid} = useContext(StoreContext);
    async function prep(editor: RefObject<HTMLTextEditorElement>) {
        const uid = auth.currentUser?.uid;
        if(editor.current === null) {
            throw Error("Trying to save with no editor reference");
        }else if (uid === undefined) {
            throw Error("Trying to save when not logged in");
        }
        console.log("Saving started, getting thumbnail");
        const thumbnail = await editor.current.getThumbnail().then(blob => blob.arrayBuffer()).then(arraybuffer => Bytes.fromUint8Array(new Uint8Array(arraybuffer)));
        if(!thumbnail) {
            throw Error("Unable to generate thumbnail for saving image");
        }
        const text = editor.current.value;
        console.log("Ready to save");
        return {text, thumbnail};
    }
	const save = async function() {
        setLoading(true);
        const {text, thumbnail} = await prep(editor);
        const id = await Store.save(fileid, filename, text, thumbnail);
        console.log("Save complete, file ID is", id);
        setLoading(false);
	};
    const saveAs = async function() {
        setLoading(true);
        const {text, thumbnail} = await prep(editor);
        const id = await Store.saveAs(filename, text, thumbnail);
        console.log("Save complete, file ID is", id);
        setFileid(id);
        setLoading(false);

    }
    return {save, saveAs};
}
export function SaveButton({asCopy = false}) {
    const {save, saveAs} = useSave();
    return <Button onClick={asCopy ? saveAs : save}>{asCopy ? 'Save Copy' : 'Save'}</Button>
}
export function SaveIconButton({asCopy = false}) {
    const {save, saveAs} = useSave();
    return <IconButton color="primary" onClick={asCopy ? saveAs : save }>{asCopy ? <ContentSavePlus/> : <SaveIcon/>}</IconButton>
}
export function SimpleFileName() {
    let { filename, setFilename } = useContext(StoreContext);
    return <TextField value={filename} placeholder="Filename" size="small" fullWidth onChange={e => setFilename(e.target.value)}/>
}
export function FileName({editable = false}) {
    let { filename, setFilename } = useContext(StoreContext);
    const [state, setState] = useState<{editing: boolean, currentName: string}>({editing: false, currentName: filename});
    const save = () => {
        setFilename(state.currentName);
        setState({...state, editing: false});
    }
    return <><InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder={editable ? "Filename" : ""}
        value={state.currentName}
        readOnly={!state.editing}
        onChange={e => setState({editing: true, currentName: e.target.value})}
        inputProps={{ 'aria-label': 'filename' }}
      />
      {editable ? (state.editing ?
        <>
        <Button onClick={e => setState({editing: false, currentName: filename})}>Cancel</Button>
        <Button onClick={save}>Save</Button>
        </>
      : 
        <Button onClick={e => setState({...state, editing: true})}>Edit</Button>
      ): <></>}
      </>
}

export function FileList() {
    let [fileList, setFileList] = useState<MacroDoc[]>([]);
    let {editor, setLoading, setFilename, setFileid} = useContext(StoreContext);
    useEffect(() => {
        let lastWatcher: Unsubscribe | null = null;
        const unregister = auth.onAuthStateChanged((user) => {
            if(lastWatcher !== null) lastWatcher();
            lastWatcher = Store.watchAll(setFileList);
        });
        return () => {
            unregister();
            if(lastWatcher) lastWatcher();
        }
    }, []);
    const load = async function(id?: string) {
        if(id === undefined) return;
        console.log("Loading started");
        setLoading(true);
        const doc = await Store.load(id);
        if(doc === null) {
            console.error("Failed to load macro ID", id);
        } else {
            setFileid(doc.id);
            setFilename(doc.name);
            editor.current?.setAttribute("value", doc.text);
        }
        setLoading(false);
    }
    // const refreshFiles = async function() {
    //     setFileList(await Store.loadAll());
    // }    
    return <>
        {/* <button onClick={refreshFiles}>Refresh</button> */}
        <ul>
            {fileList.map((macro) => (
                // Swap for buttons, disabled={loading || refreshing}
                <li key={macro.id} title={macro.id} onClick={() =>load(macro.id)}>{macro.name} <img alt="" src={`data:image/png;base64,${macro.thumbnail.toBase64()}`}/></li>
            ))}
        </ul>
    </>
}