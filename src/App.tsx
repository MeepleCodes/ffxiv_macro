import React, { KeyboardEvent, RefObject, SyntheticEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import useResizeObserver from '@react-hook/resize-observer'
import font from './res/axis-12-lobby.json';
import spritesheet from './res/axis-12-lobby.png'
import { Glyph, GlyphPage } from './Font';
import './TextEditorReact';
import {FontSizes, TextEditor} from './TextEditor';
const glyphPages: GlyphPage[] = [{name: 'Latin etc', start: 0, end: 0x2FFF, glyphs: []}, {name: "CJK", start: 0x3000, end: 0xDFFF, glyphs: []}, {name: "Private", start: 0xE000, end: 0xFFFF, glyphs: []}]
for(let [cp, glyph] of Object.entries(font.glyphs)) {
  for(let page of glyphPages) {
    if(glyph.codepoint >= page.start && glyph.codepoint <= page.end) {
      page.glyphs.push(glyph);
    }
  }
}
function App() {
  let [size, setSize] = useState<TextEditor["size"]>("12");
  let [tab, setTab] = useState<number>(0);
  const ref = useRef<TextEditor>(null);
  return (
    <div className="row outer">
      <div className="col">
        <text-editor size={size} ref={ref}/>
        <div className="row">
          Font size:
        {
        FontSizes.map(s => 
          <button key={s} onClick={e => setSize(s)}>{s}</button>
        )}
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
              title={`${String.fromCodePoint(glyph.codepoint)} (U+${glyph.codepoint.toString(16).toUpperCase().padStart(4, '0')})`}
              style={{backgroundImage: `url(${spritesheet})`, width: glyph.w, height: glyph.h, backgroundPosition: `-${glyph.x}px -${glyph.y}px`}}
              onClick={e => {
                  ref.current?.insert(String.fromCodePoint(glyph.codepoint));
                }
              }
            />)
          }
        </div>
      </div>
    </div>
  );
}

export default App;
