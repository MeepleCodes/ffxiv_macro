import React from 'react';
import HTMLTextEditorElement, { installWebComponent } from './TextEditor';
export { default as HTMLTextEditorElement } from './TextEditor';
interface TextEditorHTMLAttributes<T> extends Omit<React.HTMLAttributes<T>, "children"> {
    fontsrc: string | object;
    value?: string;
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
    fontsrc: string | object;
    value?: string;
    onSelectionChange?: (ev: Event) => any;
}

export default React.forwardRef<HTMLTextEditorElement, TextEditorProps>((props: TextEditorProps, fwdRef: React.ForwardedRef<HTMLTextEditorElement>) => {
    const {onSelectionChange, showWhitespace, ...rest} = props;
    const myRef = React.useRef<HTMLTextEditorElement>(null);
    const ref = (fwdRef!== null && typeof(fwdRef) !== "function") ? fwdRef : myRef;
    if(typeof(fwdRef) === "function") fwdRef(ref.current);
    React.useEffect(() => {
        const tgt = ref.current;
        if(onSelectionChange) {
            tgt?.addEventListener("selectionchange", onSelectionChange);
        }
        return () => {
            if(onSelectionChange) {
                tgt?.removeEventListener("selectionchange", onSelectionChange);
            }
        }
    }, [ref, fwdRef, onSelectionChange]);
    return <text-editor ref={ref} show-whitespace={showWhitespace ? "" : null} {...rest}/>
});