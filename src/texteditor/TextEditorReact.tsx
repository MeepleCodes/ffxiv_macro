import React from 'react';
import HTMLTextEditorElement, { installWebComponent } from './TextEditor';
export { default as HTMLTextEditorElement } from './TextEditor';
interface TextEditorHTMLAttributes<T> extends Omit<React.HTMLAttributes<T>, "children"> {
    fontsrc: string | object;
    value?: string;
    scale?: number;
    showWhitespace?: boolean;
}
// React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
// type TextEditorAttributes<T> = React.HTMLAttributes<T> & Omit<TextEditor, keyof HTMLCustomElement>;
type TextEditorElementProps = React.DetailedHTMLProps<TextEditorHTMLAttributes<HTMLTextEditorElement>, HTMLTextEditorElement>;
declare global {
  namespace JSX {
    interface IntrinsicElements {
        //DetailedHTMLProps<CanvasHTMLAttributes<HTMLCanvasElement>, HTMLCanvasElement> 
        ['text-editor']: TextEditorElementProps
    }
  }
}
installWebComponent();

type TextEditorProps = TextEditorElementProps & {
    onSelectionChange?: (ev: Event) => any;
}

export default React.forwardRef<HTMLTextEditorElement, TextEditorProps>(function TextEditor(props: TextEditorProps, fwdRef: React.ForwardedRef<HTMLTextEditorElement|null>) {
    const {onSelectionChange, showWhitespace, ...rest} = props;
    const myRef = React.useRef<HTMLTextEditorElement>(null);
    React.useImperativeHandle<HTMLTextEditorElement|null, HTMLTextEditorElement|null>(fwdRef, () => myRef.current);
    React.useEffect(() => {
        const tgt = myRef.current;
        if(onSelectionChange) {
            tgt?.addEventListener("selectionchange", onSelectionChange);
        }
        return () => {
            if(onSelectionChange) {
                tgt?.removeEventListener("selectionchange", onSelectionChange);
            }
        }
    }, [myRef, onSelectionChange]);
    return <text-editor ref={myRef} show-whitespace={showWhitespace ? "" : null} {...rest}/>
});
