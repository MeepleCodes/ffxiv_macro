import React, { KeyboardEvent, RefObject, SyntheticEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import useResizeObserver from '@react-hook/resize-observer'
import font from './res/axis-12-lobby.json';
import spritesheet from './res/axis-12-lobby.png'
import {FontSizes, TextEditor} from './TextEdit';

function App() {
  let [size, setSize] = useState<TextEditor["size"]>("18");
  return (
    <div className="outer">
      <text-editor size={size} width={400} height={400} tabIndex={1} contentEditable="true"/>
      {
      FontSizes.map(s => 
        <button key={s} onClick={e => setSize(s)}>{s}</button>
      )}
      blah
    </div>
  );
}

export default App;
