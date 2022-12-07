import { MutableRefObject, DetailedHTMLProps, HTMLAttributes, DOMAttributes, RefAttributes } from 'react';
import { TextEditor } from './TextEditor';
// type TextEditorElement = Partial<TextEditor & DOMAttributes<TextEditor & { children: any }> & RefAttributes<MutableRefObject<TextEditor>>>;
type TextEditorElement = DetailedHTMLProps<HTMLAttributes<TextEditor> & Partial<TextEditor>, TextEditor>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
        //DetailedHTMLProps<CanvasHTMLAttributes<HTMLCanvasElement>, HTMLCanvasElement> 
      ['text-editor']: TextEditorElement
    }
  }
}
