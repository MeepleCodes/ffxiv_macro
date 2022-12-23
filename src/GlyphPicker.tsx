import { RefObject, useState } from "react";
import HTMLTextEditorElement from "./texteditor/TextEditor";


import { GlyphPage } from './texteditor/Font';
import font from './axis-12-lobby.json';
import spritesheet from './res/axis-12-lobby.png'

const glyphPages: GlyphPage[] = [{name: 'Latin etc', start: 0, end: 0x2FFF, glyphs: []}, {name: "CJK", start: 0x3000, end: 0xDFFF, glyphs: []}, {name: "Private", start: 0xE000, end: 0xFFFF, glyphs: []}]
for(let glyph of font.glyphs.slice(1)) {
	for(let page of glyphPages) {
		if(glyph.codepoint >= page.start && glyph.codepoint <= page.end) {
			page.glyphs.push(glyph);
		}
	}
}


export default function GlyphPicker({editorRef}: {editorRef: RefObject<HTMLTextEditorElement>}) {
    
	let [tab, setTab] = useState<number>(0);
    return <div className="col">
                        
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
                <img 
                    className="g" 
                    key={glyph.codepoint}
                    alt={`${String.fromCodePoint(glyph.codepoint)} (U+${glyph.codepoint.toString(16).toUpperCase().padStart(4, '0')}) ${glyph.w + glyph.right}x${glyph.h}px`}
                    src={spritesheet}
                    style={{objectPosition: `-${glyph.x}px -${glyph.y}px`, width: glyph.w, height: glyph.h}}
                    onClick={e => {
                            editorRef.current?.insert(String.fromCodePoint(glyph.codepoint));
                            editorRef.current?.focus();
                        }
                    }
                />)
            }
        </div>
    </div>
}