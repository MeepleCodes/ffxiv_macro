import { useContext, useEffect, useRef, useState } from 'react';
import './App.css';
import TextEditor, {HTMLTextEditorElement} from './texteditor/TextEditorReact';
import { MacroDoc, Store } from './store/Firebase';
import { Bytes } from 'firebase/firestore';
import { SaveControls, FileList, StoreContextProvider, FileName, SaveButton } from './store/StoreControls';
import GlyphPicker from './GlyphPicker';


import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import EditIcon from '@mui/icons-material/Edit';
import CardActions from '@mui/material/CardActions';
import CardHeader from '@mui/material/CardContent';
import CardContent from '@mui/material/CardContent';
import { Stack } from '@mui/material';

// // Force an import of this otherwise webpack doesn't think it's referenced
// require("./TextEditor");

type FontSource = {
	name: string;
	size: string;
	src: string;
	request: string;
}
const fontSources: FontSource[] = [];

function importRes(requireContext: __WebpackModuleApi.RequireContext, cache = false) {
	requireContext.keys().forEach((request) => {
		const src = requireContext(request);
		if(cache) {
				const parts = (request.startsWith("./") ? request.substring(2) : request).split(/[-.]/).slice(0,2);
				const name = parts[0].charAt(0).toUpperCase() + parts[0].substring(1) + " " + parts[1];
				const size = parts[1];
				fontSources.push({name, size, src, request});
		}
		
	});
}

importRes(require.context('./res/', true, /\.png$/), false);
importRes(require.context('./res/', true, /-combined\.json$/), true);

type TEInfo = {
	cursorX: number,
	cursorY: number,
	cursorRow: number,
	cursorCol: number,
	selectionLength: number,
	selectionPixels: number | null
};
function App() {
	let [font, setFont] = useState<FontSource>(fontSources[0]);
	let [cur, setCur] = useState<TEInfo | undefined>();
    let [fileList, setFileList] = useState<MacroDoc[]>([]);
    let [loading, setLoading] = useState<boolean>(false);
    let ref = useRef<HTMLTextEditorElement>(null);

    const updateCursor = (ev: Event) => {
        const t = ev.target as HTMLTextEditorElement;
        setCur({
            cursorX: t.cursorX,
            cursorY: t.cursorY,
            cursorRow: t.cursorRow,
            cursorCol: t.cursorCol,
            selectionLength: t.selectionLength,
            selectionPixels: t.selectionPixels,
        });
    };
	let selectionText = "";
	if(cur && cur.selectionLength > 0) {
		if(cur.selectionPixels !== null) {
			selectionText = `(${cur.selectionLength} selected, ${cur.selectionPixels}px)`;
		} else {
			selectionText = `(${cur.selectionLength} selected)`;
		}
		
	}
 
	return (
		<StoreContextProvider editor={ref}>
			<Card>
				<CardHeader>
					<FileName editable={true}/>
					<SaveButton/>
				</CardHeader>
				<CardContent>
						<TextEditor fontsrc={font.src} ref={ref} onUpdate={updateCursor} value={"line\n\nline"}/>
				</CardContent>
			<CardActions>
				Font:
					{fontSources.map((fontSource: FontSource) => <button title={fontSource.request} key={fontSource.request} onClick={e => setFont(fontSource)}>{fontSource.name}</button>)}
					{cur && <div className="status row">
						Ln {cur.cursorRow}, Col {cur.cursorCol} [{cur.cursorX}, {cur.cursorY}] {selectionText}
					</div>}
				
			</CardActions>
			</Card>
			<Card>
				<CardContent>
					<GlyphPicker editorRef={ref} />
				</CardContent>
			</Card>
			<Card>
				<CardContent>
					<FileList/>
				</CardContent>
			</Card>
		</StoreContextProvider>
		
	);
}

export default App;
