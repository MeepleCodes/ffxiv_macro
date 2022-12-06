import React, { KeyboardEvent, RefObject, SyntheticEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import useResizeObserver from '@react-hook/resize-observer'
import font from './res/axis-12-lobby.json';
import spritesheet from './res/axis-12-lobby.png'
import {FontSizes, TextEditor} from './TextEdit';

function App() {
  let [size, setSize] = useState<TextEditor["size"]>("18");
  const ref = useRef<TextEditor>(null);
  return (
    <div className="outer">
      <text-editor size={size} ref={ref} width={400} height={400} tabIndex={1} contentEditable="true"/>
      {
      FontSizes.map(s => 
        <button key={s} onClick={e => setSize(s)}>{s}</button>
      )}
      <div className="glyphs">
        {Object.entries(font.glyphs).map(([cp, glyph]) => 
          <p 
            className="g" 
            key={cp}
            title={`${String.fromCodePoint(parseInt(cp))} (U+${parseInt(cp).toString(16)})`}
            style={{backgroundImage: `url(${spritesheet})`, width: glyph.w, height: glyph.h, backgroundPosition: `-${glyph.x}px -${glyph.y}px`}}
            onClick={e => {
                ref.current?.insert(String.fromCodePoint(parseInt(cp)));
                // setText(textRef.current?.value!);
              }
            }
          />)
        }
      </div>
    </div>
  );
}

export default App;
