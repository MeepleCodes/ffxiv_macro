import React, { KeyboardEvent, RefObject, SyntheticEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import useResizeObserver from '@react-hook/resize-observer'
import font from './res/axis-12-lobby.json';
import spritesheet from './res/axis-12-lobby.png'

class TextAndSelection {
  constructor(public text: string, public start: number, public end: number = start, public forward: boolean = true) {
    if(this.start > this.end) {
      let t = this.start;
      this.start = this.end;
      this.end = t;
      this.forward = false;
    }
    const strlen = [...this.text].length;
    this.start = Math.min(this.start, strlen);
    this.end = Math.min(this.end, strlen);
  }
  preSelection(): string {
    return this.text.substring(0, this.start);
  }
  postSelection(): string {
    return this.text.substring(this.end);
  }
  cursor(): number {
    return this.forward ? this.end : this.start;
  }

  insert(text: string): TextAndSelection {
    return new TextAndSelection(
      this.preSelection() + text + this.postSelection(),
      this.start + [...text].length,
      this.start + [...text].length,
      true
    );
  }
  delete(forward: boolean): TextAndSelection {
    if(this.end > this.start) {
      return new TextAndSelection(this.preSelection() + this.postSelection(), this.start, this.start, true);
    } else if(forward) {
      return new TextAndSelection(this.preSelection() + this.postSelection().substring(1), this.start, this.start, true);
    } else {
      let newC = Math.max(0, this.start - 1);
      return new TextAndSelection(this.text.substring(0, newC) + this.postSelection(), newC, newC, true);
    }
  }
  moveX(forward: boolean): TextAndSelection {
    if(this.start != this.end) {
      return new TextAndSelection(this.text, forward ? this.end : this.start);
    } else {
      return new TextAndSelection(this.text, this.cursor() + (forward ? +1 : -1));
    }
  }
  extendX(x: number): TextAndSelection {
    if(this.forward || this.start == this.end) {
      console.log("Extending forward by", x);
      return new TextAndSelection(this.text, this.start, this.end + x, this.start<=this.end + x);
    } else {
      return new TextAndSelection(this.text, this.start + x, this.end, this.start + x > this.end);
    }
  }
};

function redrawCanvas(canvas: HTMLCanvasElement, image: HTMLImageElement, textSel: TextAndSelection, showCursor: boolean) {
  const context = canvas.getContext("2d");
  if(!context) return;
  const margin = {x: 1, y: 1};
  context.clearRect(0, 0, canvas.width, canvas.height);
  // console.log("Updating, text is", text, "selection is", selection, "blink is", cursorBlink);
  // TODO: Customise these
  context.fillStyle = "#000080";
  context.strokeStyle = "#000000";
  // Current character, determines when we paint a selection
  let c = 0;
  let y = margin.y;
  for(const line of textSel.text.split("\n")) {
    let x = margin.x;
    // When we want to do colour we'll need to mess around with https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing
    for (const cpChar of line) {
      const codepoint = cpChar.codePointAt(0);
      const key = `${codepoint}`;
      var glyph = font.glyphs[key as keyof typeof font.glyphs] || font.default_glyph;
      // TODO: Kerning
      var advance_width = glyph.w + glyph.right;
      if (c >= textSel.start && c < textSel.end) {
        context.fillRect(x, y, advance_width, font.line_height);
      }
      // If the cursor is not currently blinking and should be
      // at this position, draw it (to the left)      
      if(showCursor && textSel.cursor() == c) {
         context.strokeRect(x, y, 0, font.line_height);
      }
      context.drawImage(image, glyph.x, glyph.y, glyph.w, glyph.h, x, y + glyph.top, glyph.w, glyph.h);
      x += advance_width;
      c++;
    }
    // If the cursor is at the end of the line, draw it after the last glyph
    if(showCursor && textSel.cursor() == c) {
      context.strokeRect(x, y, 0, font.line_height);
    }
    y += font.line_height;
    // the linebreak is also a character for cursor purposes
    c++;
  }
}

function App({blinkInterval = 500}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [image, setImage] = useState<HTMLImageElement|null>(null);
  const [textSelection, setTextSelection] = useState<TextAndSelection>(new TextAndSelection("", 0, 0, true));
  const [cursorBlink, setBlink] = useState<boolean>(true);
  const [hasFocus, setFocus] = useState<boolean>(() => canvasRef.current?.matches(":focus") || false);
  // Use an empty dependencies list to avoid restarting the timer any
  // time anything changes (actually not sure that's what we want
  // given VSCode stops the cursor blinking while you're typing, so...)
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink((b) => !b)}, blinkInterval);
    console.log("New interval started", interval);
    return () => {
      console.log("Interval", interval, "ended");
      clearInterval(interval);
    }
  }, []);
  const keyDown = (e:KeyboardEvent<HTMLCanvasElement>) => {
    // If it's a typeable character then it will have a single codepoint
    if([...e.key].length === 1) {
      setTextSelection((current) => current.insert(e.key));
    } else {
      switch(e.key) {
        case "Backspace":
          setTextSelection((current) => current.delete(false));
          break;
        case "Right":
        case "ArrowRight":
          if(e.getModifierState("Shift")) setTextSelection((current) => current.extendX(1));  
          else setTextSelection((current) => current.moveX(true));
          break;
        case "Left":
        case "ArrowLeft":
          if(e.getModifierState("Shift")) setTextSelection((current) => current.extendX(-1));
          else setTextSelection((current) => current.moveX(false));
          break;
        default:
          console.log("Unhandled key", e.key);
      }
    }
  }
  // const fromTextbox = (event: SyntheticEvent<HTMLTextAreaElement>) => {
  //   const textbox: HTMLTextAreaElement = event.currentTarget;
  //   setText(textbox.value);
  //   setSelection({start: textbox.selectionStart, end: textbox.selectionEnd, direction: textbox.selectionDirection});
  // }

  useLayoutEffect(() => {
    if(!canvasRef.current || !image) return;
    redrawCanvas(canvasRef.current, image, textSelection, hasFocus && !cursorBlink)
  }, [canvasRef, image, textSelection, hasFocus, cursorBlink]);
  return (
    <div className="outer">
      <img src={spritesheet} onLoad={e => setImage(e.currentTarget)}/>
      <textarea ref={textRef}/>
      <canvas ref={canvasRef} width="400" height="400" tabIndex={1}
        onFocus={e => setFocus(true)}
        onBlur={e => setFocus(false)}
        onKeyDown={keyDown}
        />
      <div className="glyphs">
        {Object.entries(font.glyphs).map(([cp, glyph]) => 
          <p 
            className="g" 
            key={cp}
            title={`${String.fromCodePoint(parseInt(cp))} (U+${parseInt(cp).toString(16)})`}
            style={{backgroundImage: `url(${spritesheet})`, width: glyph.w, height: glyph.h, backgroundPosition: `-${glyph.x}px -${glyph.y}px`}}
            onClick={e => {
                textRef.current?.setRangeText(String.fromCodePoint(parseInt(cp)), textRef.current.selectionStart, textRef.current.selectionEnd, "end");
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
