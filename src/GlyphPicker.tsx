import { RefObject, useState } from "react";

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card, {CardProps} from '@mui/material/Card';
import CardHeader from '@mui/material/CardContent';
import CardContent from '@mui/material/CardContent';

import HTMLTextEditorElement from "./texteditor/TextEditor";
import { Glyph, GlyphPage } from './texteditor/Font';
import font from './axis-12-lobby.json';
import spritesheet from './res/axis-12-lobby.png'
import GlyphViewerReact from "./glyphviewer/GlyphViewerReact";

const glyphPages: GlyphPage[] = [{name: 'Latin etc', start: 0, end: 0x2FFF, glyphs: []}, {name: "CJK", start: 0x3000, end: 0xDFFF, glyphs: []}, {name: "Private", start: 0xE000, end: 0xFFFF, glyphs: []}]
for(let glyph of font.glyphs.slice(1)) {
	for(let page of glyphPages) {
		if(glyph.codepoint >= page.start && glyph.codepoint <= page.end) {
			page.glyphs.push(glyph);
		}
	}
}
type GlyphPickerProps = CardProps & {
    editorRef: RefObject<HTMLTextEditorElement>;
    fontsrc: string;
};
export type GlyphProps = {editorRef: RefObject<HTMLTextEditorElement>, glyph: Glyph};
export function GlyphP({editorRef, glyph}: GlyphProps) {
    return <p 
            className="g"
            draggable
            title={`${String.fromCodePoint(glyph.codepoint)} (U+${glyph.codepoint.toString(16).toUpperCase().padStart(4, '0')}) ${glyph.w + glyph.right}x${glyph.h}px`}
            style={{backgroundImage: `url(${spritesheet})`, width: glyph.w, height: glyph.h, backgroundPosition: `-${glyph.x}px -${glyph.y}px`}}
            onDragStart={e => e.dataTransfer.setData("text/plain", String.fromCodePoint(glyph.codepoint))}
            onClick={e => {
                editorRef.current?.insert(String.fromCodePoint(glyph.codepoint));
                editorRef.current?.focus();
            }}
            />//            >{String.fromCodePoint(glyph.codepoint)}</p>
}
export function GlyphImg({editorRef, glyph}: GlyphProps) {
    return <img
        className="g" 
        alt={`${String.fromCodePoint(glyph.codepoint)} (U+${glyph.codepoint.toString(16).toUpperCase().padStart(4, '0')}) ${glyph.w + glyph.right}x${glyph.h}px`}
        src={spritesheet}
        style={{objectPosition: `-${glyph.x}px -${glyph.y}px`, width: glyph.w, height: glyph.h}}
        onDragStart={e => e.dataTransfer.setData("text/plain", String.fromCodePoint(glyph.codepoint))}
        onClick={e => {
                editorRef.current?.insert(String.fromCodePoint(glyph.codepoint));
                editorRef.current?.focus();
            }
        }
    />
}

export default function GlyphPicker(props: GlyphPickerProps) {
    const {editorRef, fontsrc, ...rest} = props;
	let [tab, setTab] = useState<number>(0);
    return <Card {...rest}>
        <CardHeader>
            <Tabs value={tab} onChange={(e, v) => setTab(v)}>
            {glyphPages.map((p, i) => (
            <Tab 
                id={`glyph-tab-${i}`}
                aria-controls={`glyph-tabpanel-${i}`}
                key={i}
                value={i}
                label={p.name}
                />
            ))}
            </Tabs>
        </CardHeader>
        <CardContent sx={{maxWidth: 400, maxHeight: 400, overflow: "auto"}}>
            <GlyphViewerReact value={glyphPages[tab].glyphs.map(g => String.fromCodePoint(g.codepoint)).join("")} fontsrc={fontsrc}/>
        {/* {glyphPages[tab].glyphs.map(g => <GlyphP editorRef={editorRef} glyph={g} key={g.codepoint}/>)} */}
        </CardContent>
    </Card>
}