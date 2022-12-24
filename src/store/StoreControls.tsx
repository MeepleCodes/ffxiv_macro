import React, { createContext, createRef, RefObject, useContext, useRef, useState } from "react";
import { MacroDoc, Store } from './Firebase';
import { HTMLTextEditorElement } from './../texteditor/TextEditorReact'
import { Bytes } from "firebase/firestore";
import { emitWarning } from "process";

const dontUseDefault = (nv: any) => {throw new Error("Don't use the default context");};

const StoreContext = createContext<Ctx>({editor: createRef(), loading: false, setLoading: dontUseDefault, filename: "", fileid: undefined, setFilename: dontUseDefault, setFileid: dontUseDefault});

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

export function useSave() {
    let {editor, loading, setLoading, filename, setFilename, fileid, setFileid} = useContext(StoreContext);
    const getMacro = async function(): Promise<MacroDoc | null> {
        if(editor.current === null) return null;
        const name = filename;
        const text = editor.current.getText()|| "";
        return await editor.current.getThumbnail().then(blob => blob.arrayBuffer()).then(arraybuffer => {
                return {
                    id: undefined,
                    draft: false,
                    name,
                    text,
                    thumbnail: Bytes.fromUint8Array(new Uint8Array(arraybuffer))
                };
            });
    }
	const save = async function(id?: string) {
        console.log("Saving started, getting thumbnail");
        setLoading(true);
        const macro = await getMacro();
        
        if(macro !== null) {
            console.log("Ready to save");
		    const id = await Store.save(fileid, macro);
            console.log("Save complete, file ID is", id);
            setFileid(id);
        } else {
            console.error("Unable to generate thumbnail for saving");
        }
        setLoading(false);
	}
    return save;
}

export function SaveControls() {
    let {loading, filename, setFilename, fileid} = useContext(StoreContext);
    const save = useSave();
    return <>
			Filename <input type="text" value={filename} onChange={e => setFilename(e.target.value)}/>
				<button onClick={e => save(fileid)} disabled={filename === "" || loading}>Save</button>
				<button onClick={e => save(undefined)} disabled={filename === "" || loading}>Save copy</button>
    </>
}

export function FileList() {
    let [fileList, setFileList] = useState<MacroDoc[]>([]);
    let {editor, loading, setLoading, setFilename, setFileid} = useContext(StoreContext);

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
    const refreshFiles = async function() {
        setFileList(await Store.loadAll());
    }    
    return <>
        <button onClick={refreshFiles}>Refresh</button>
        <ul>
            {fileList.map((macro) => (
                // Swap for buttons, disabled={loading || refreshing}
                <li key={macro.id} title={macro.id} onClick={() =>load(macro.id)}>{macro.name} <img alt="" src={`data:image/png;base64,${macro.thumbnail.toBase64()}`}/></li>
            ))}
        </ul>
    </>
}