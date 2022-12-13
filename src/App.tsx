import { useRef, useState } from 'react';
import './App.css';
import font from './axis-12-lobby.json';
import spritesheet from './res/axis-12-lobby.png'
import { GlyphPage } from './Font';
import { TextEditor } from './TextEditor';
import './TextEditorReact';
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

const glyphPages: GlyphPage[] = [{name: 'Latin etc', start: 0, end: 0x2FFF, glyphs: []}, {name: "CJK", start: 0x3000, end: 0xDFFF, glyphs: []}, {name: "Private", start: 0xE000, end: 0xFFFF, glyphs: []}]
for(let glyph of font.glyphs.slice(1)) {
  for(let page of glyphPages) {
    if(glyph.codepoint >= page.start && glyph.codepoint <= page.end) {
      page.glyphs.push(glyph);
    }
  }
}
function App() {
  // let [size, setSize] = useState<TextEditor["size"]>("12");
  let [font, setFont] = useState<FontSource>(fontSources[0]);
  let [tab, setTab] = useState<number>(0);
  const ref = useRef<TextEditor>(null);
  console.log("App function ran");
  return (
    <div className="row outer">
      <div className="col">
        <text-editor fontsrc={font.src} ref={ref}>
          This is some text!
        </text-editor>
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
