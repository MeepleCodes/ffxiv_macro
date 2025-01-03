import React, { MouseEvent, RefObject, useRef, useState } from "react";

import { BoxProps } from '@mui/material';



import HTMLTextEditorElement from "../../texteditor/TextEditor";
import { Glyph } from '../../texteditor/Font';

import GlyphViewerReact, { HTMLGlyphViewerElement } from "../../glyphviewer/GlyphViewerReact";
import { GlyphPosition } from "../../texteditor/TextModel";



import {
    Tabs,
    Tab,
    Box,
    Tooltip,
    Stack,
    Typography,
    ClickAwayListener,
} from '@mui/material';
import { glyphPages } from "./glyphPages";




type GlyphPickerProps = BoxProps & {
    editorRef: RefObject<HTMLTextEditorElement>;
    fontsrc: string;
};


function GlyphTooltip({glyph, fontsrc}: {glyph?: Glyph, fontsrc: string}) {
    return glyph === undefined ? <></> : <Stack>
        <Typography >U+{glyph.codepoint.toString(16).toUpperCase().padStart(4, '0')}</Typography>
        <GlyphViewerReact scale={4} style={{padding: 0, color: 'white', background: 'black', '--glyph-background': 'rgba(235, 255, 255, 0.25)'}} value={String.fromCodePoint(glyph.codepoint)} fontsrc={fontsrc}/>        
        <Typography variant="caption">{glyph.w + glyph.right}x{glyph.h+glyph.top}px</Typography>
    </Stack>
}
export default React.memo(function GlyphPicker(props: GlyphPickerProps) {
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
    return (
        <Box {...rest}>
            <Stack direction="column">
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
                <Box sx={{flexGrow: 1, overflowY: "scroll", overflowX: "hidden"}}>
                    <ClickAwayListener onClickAway={clickOut}>
                        <Tooltip open={hover || pinned} followCursor={!pinned} PopperProps={{anchorEl: anchor}} onClose={() => setHover(false)} onOpen={() => setHover(true)} title={<GlyphTooltip glyph={glyph?.glyph} fontsrc={fontsrc}/>}>
                        <GlyphViewerReact
                            ref={ref}
                            onClick={pinGlyph}
                            onDoubleClick={insertGlyph}
                            onMouseMove={hoverGlyph}
                            value={glyphPages[tab].glyphs.map(g => String.fromCodePoint(g.codepoint)).join("")}
                            fontsrc={fontsrc}
                        />
                        </Tooltip>
                    </ClickAwayListener>
                </Box>
            </Stack>
        </Box>
    )
});