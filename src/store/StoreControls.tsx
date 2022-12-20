import { createContext, useContext, useState } from "react";
import { MacroDoc, Store } from './Firebase';
import { HTMLTextEditorElement } from './../texteditor/TextEditorReact'
import { Bytes } from "firebase/firestore";

const StoreContext = createContext<Ctx>({loading: false, setLoading: (newValue) => {}});

type Ctx = {
    loading: boolean,
    setLoading: (newValue: boolean) => void;
}

export function StoreContextProvider() {
    const [loading, setLoading] = useState<boolean>(false);
    return <StoreContext.Provider value={{loading, setLoading}}/>
}

export function SaveControls({editor}: {editor: HTMLTextEditorElement}) {
	let [filename, setFilename] = useState<string>("");
    let [fileid, setFileid] = useState<string|undefined>();    
    let {loading, setLoading} = useContext(StoreContext);
    const getMacro = async function(): Promise<MacroDoc | null> {
        const name = filename;
        const text = editor.getText()|| "";
        return await editor.getThumbnail().then(blob => blob.arrayBuffer()).then(arraybuffer => {
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
            editor.setAttribute("value", doc.text);
        }
        setLoading(false);
    }
    const refreshFiles = async function() {
        setFileList(await Store.loadAll());
    }
}