import React from 'react';
import { TextEditor } from './TextEditor';
interface TextEditorHTMLAttributes<T> extends React.HTMLAttributes<T> {
  fontsrc: string | object;
  value?: string;
}
console.log("TextEditorReact imported");
// type TextEditorAttributes<T> = React.HTMLAttributes<T> & Omit<TextEditor, keyof HTMLCustomElement>;
type TextEditorElement = React.DetailedHTMLProps<TextEditorHTMLAttributes<TextEditor>, TextEditor>;
// React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
declare global {
  namespace JSX {
    interface IntrinsicElements {
        //DetailedHTMLProps<CanvasHTMLAttributes<HTMLCanvasElement>, HTMLCanvasElement> 
      ['text-editor']: TextEditorElement
    }
  }
}
