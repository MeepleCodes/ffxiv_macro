import { MouseEvent, RefObject, useRef, useState } from "react";

import { CardProps } from '@mui/material/Card';
import ClickAwayListener from '@mui/base/ClickAwayListener';


import HTMLTextEditorElement from "./texteditor/TextEditor";
import { Glyph } from './texteditor/Font';
import font from './axis-12-lobby.json';
import spritesheet from './res/axis-12-lobby.png'
import GlyphViewerReact, { HTMLGlyphViewerElement } from "./glyphviewer/GlyphViewerReact";
import { GlyphPosition } from "./texteditor/TextModel";



import {
    Tabs,
    Tab,
    Card,
    CardContent as CardHeader,
    CardMedia,
    Tooltip,
    Stack,
    Typography,
} from '@mui/material';



export interface GlyphPage {
    name: string;
    ranges: ([number, number]|[number])[];
    glyphs: Glyph[];
}

const glyphPages: GlyphPage[] = [
    {name: 'Useful', ranges:[[0x20], [0xAD], [0x3000], [0x2010, 0x277E], [0xe000, 0xffff]], glyphs:[]},
    {name: 'Latin etc', ranges: [[0,0x2FFF]], glyphs: []},
    {name: "CJK", ranges: [[0x3000, 0xDFFF]], glyphs: []},
    {name: "Private", ranges: [[0xE000, 0xFFFF]], glyphs: []},
];
for(let glyph of font.glyphs.slice(1)) {
	for(let page of glyphPages) {
		if(page.ranges.some(([start,end]) => end === undefined ? glyph.codepoint === start : (glyph.codepoint >= start && glyph.codepoint <= end))) {
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

function GlyphTooltip({glyph, fontsrc}: {glyph?: Glyph, fontsrc: string}) {
    return glyph === undefined ? <></> : <Stack>
        <Typography >U+{glyph.codepoint.toString(16).toUpperCase().padStart(4, '0')}</Typography>
        <GlyphViewerReact scale={4} style={{padding: 0, color: 'white', background: 'black', '--glyph-background': 'rgba(235, 255, 255, 0.25)'}} value={String.fromCodePoint(glyph.codepoint)} fontsrc={fontsrc}/>        
        <Typography variant="caption">{glyph.w + glyph.right}x{glyph.h+glyph.top}px</Typography>
    </Stack>
}
export default function GlyphPicker(props: GlyphPickerProps) {
    const {editorRef, fontsrc, ...rest} = props;
    const ref = useRef<HTMLGlyphViewerElement>(null);
    const [pinned, setPinned] = useState(false);
    const [hover, setHover] = useState(false);
    const [glyph, setGlyph] = useState<GlyphPosition|undefined>();
	let [tab, setTab] = useState<number>(0);
    const insertGlyph = (ev: MouseEvent) => {
        const g = ref.current?.glyphAtCursor(ev);
        if(g && g.glyph) {
            editorRef.current?.insert(String.fromCodePoint(g.glyph.codepoint));
            editorRef.current?.focus();
        }
    }

    const pinGlyph = (ev: MouseEvent) => {
        const g = ref.current?.glyphAtCursor(ev);
        if(g) {
            setPinned(true);
            setGlyph(g);
        } 
    }
    const hoverGlyph = (ev: MouseEvent) => {
        if(pinned) return;
        const g = ref.current?.glyphAtCursor(ev);
        if(g && g.glyph) setGlyph(g);
    }
    const clickOut = () => {
        setPinned(false);
    }
    const anchor = {
        getBoundingClientRect: () => {
            if(glyph && ref.current) return ref.current?.glyphBoundingBox(glyph);
            return new DOMRect(0, 0, 0, 0);
        },
        contextElement: ref.current?.canvasElement
    }
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
        <CardMedia sx={{minWidth: 400, maxHeight: (theme) => 432, overflowY: "scroll"}}>
            {/* <Popper open={pinned} anchorEl={anchor} modifiers={popperModifiers}>
                {glyph !== undefined && glyph.glyph !== undefined && <Card>
                    <CardHeader>{String.fromCodePoint(glyph.glyph.codepoint)} (U+{glyph.glyph.codepoint.toString(16).toUpperCase().padStart(4, '0')})</CardHeader>
                    <CardMedia><GlyphViewerReact style={{width: 40, height: 40}} value={String.fromCodePoint(glyph.glyph.codepoint)} fontsrc={fontsrc}/></CardMedia>
                    <CardContent>{glyph.glyph.w + glyph.glyph.right}x{glyph.glyph.h}px</CardContent>
                </Card>}
            </Popper> */}
            <ClickAwayListener onClickAway={clickOut}>
                <Tooltip open={hover || pinned} followCursor={!pinned} PopperProps={{anchorEl: anchor}} onClose={() => setHover(false)} onOpen={() => setHover(true)} title={<GlyphTooltip glyph={glyph?.glyph} fontsrc={fontsrc}/>}>
                <GlyphViewerReact ref={ref} onClick={pinGlyph} onDoubleClick={insertGlyph} onMouseMove={hoverGlyph} value={glyphPages[tab].glyphs.map(g => String.fromCodePoint(g.codepoint)).join("")} fontsrc={fontsrc}/>
                </Tooltip>
            </ClickAwayListener>
        {/* {glyphPages[tab].glyphs.map(g => <GlyphP editorRef={editorRef} glyph={g} key={g.codepoint}/>)} */}
        </CardMedia>
    </Card>
}