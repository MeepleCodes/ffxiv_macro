import { useEffect, useRef, useState } from 'react';
import './App.css';
import font from './axis-12-lobby.json';
import spritesheet from './res/axis-12-lobby.png'
import { GlyphPage } from './texteditor/Font';
import TextEditor, {HTMLTextEditorElement} from './texteditor/TextEditorReact';
import { MacroDoc, Store } from './store/Firebase';
import { Bytes } from 'firebase/firestore';
import { SaveControls, FileList, StoreContextProvider } from './store/StoreControls';

// // Force an import of this otherwise webpack doesn't think it's referenced
// require("./TextEditor");

type FontSource = {
	name: string;
	src: string;
	request: string;
}
const fontSources: FontSource[] = [];

function importRes(requireContext: __WebpackModuleApi.RequireContext, cache = false) {
	requireContext.keys().forEach((request) => {
		const res = requireContext(request);
		if(cache) {
				const parts = (request.startsWith("./") ? request.substring(2) : request).split(/[-.]/).slice(0,2);
				const name = parts[0].charAt(0).toUpperCase() + parts[0].substring(1) + " " + parts[1];
				fontSources.push({
					name: name,
					src: res,
					request: request
				});
		}
		
	});
}

importRes(require.context('./res/', true, /\.png$/), false);
importRes(require.context('./res/', true, /-combined\.json$/), true);

let glyphPages: GlyphPage[] = [{name: 'Latin etc', start: 0, end: 0x2FFF, glyphs: []}, {name: "CJK", start: 0x3000, end: 0xDFFF, glyphs: []}, {name: "Private", start: 0xE000, end: 0xFFFF, glyphs: []}]
// let glyphPages: GlyphPage[] = font.blocks.map(b => ({...b, glyphs: []}));
for(let glyph of font.glyphs.slice(1)) {
	for(let page of glyphPages) {
		if(glyph.codepoint >= page.start && glyph.codepoint <= page.end) {
			page.glyphs.push(glyph);
		}
	}
}
glyphPages = glyphPages.filter(g => g.glyphs.length > 0);
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
	let [tab, setTab] = useState<number>(0);
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
		<div className="col outer">
			<div className="row">
				<SaveControls/>
			</div>
			<div className="row">
				<div className="col">
					<TextEditor fontsrc={font.src} ref={ref} onUpdate={updateCursor} value={"line\n\nline"}/>
					{cur && <div className="status row">
						Ln {cur.cursorRow}, Col {cur.cursorCol} [{cur.cursorX}, {cur.cursorY}] {selectionText}
					</div>}
					<div className="row">
						Font:
					{fontSources.map((fontSource: FontSource) => <button title={fontSource.request} key={fontSource.request} onClick={e => setFont(fontSource)}>{fontSource.name}</button>)}
					</div>
				</div>
				<div className="col">
					<div className="row">
						{glyphPages.map((p, i) => 
						<button 
							className={tab === i ? "tab selected" : "tab"}
							key={i}
							onClick={e => setTab(i)}>{p.name}</button>
						)}
					</div>
					<div className="glyphs">
						{glyphPages[tab].glyphs.map(glyph => 
							<p 
								className="g" 
								key={glyph.codepoint}
                                draggable="true"
								title={`${String.fromCodePoint(glyph.codepoint)} (U+${glyph.codepoint.toString(16).toUpperCase().padStart(4, '0')}) ${glyph.w + glyph.right}x${glyph.h}px`}
								// src={spritesheet}
							//	style={{objectPosition: `-${glyph.x}px -${glyph.y}px`, width: glyph.w, height: glyph.h}}
                                style={{backgroundImage: `url(${spritesheet})`, width: glyph.w, height: glyph.h, backgroundPosition: `-${glyph.x}px -${glyph.y}px`}}
								onClick={e => {
										ref.current?.insert(String.fromCodePoint(glyph.codepoint));
										ref.current?.focus();
									}
								}
                                onDragStart={e => e.dataTransfer.setData("text/plain", String.fromCodePoint(glyph.codepoint))}
							></p>)
						}
					</div>
				</div>
                <div className="col"><FileList/>
                </div>
			</div>
			</div>
			</StoreContextProvider>
		
	);
}

export default App;
