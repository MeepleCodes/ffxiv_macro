import React from 'react';
import HTMLTextEditorElement, { installWebComponent } from './TextEditor';
export { default as HTMLTextEditorElement } from './TextEditor';
interface TextEditorHTMLAttributes<T> extends React.HTMLAttributes<T> {
    fontsrc: string | object;
    value?: string;
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
    onUpdate?: (ev: Event) => any;
}

export default React.forwardRef<HTMLTextEditorElement, TextEditorProps>((props: TextEditorProps, fwdRef: React.ForwardedRef<HTMLTextEditorElement>) => {
    const {onUpdate, ...rest} = props;
    const myRef = React.useRef<HTMLTextEditorElement>(null);
    const ref = (fwdRef!== null && typeof(fwdRef) !== "function") ? fwdRef : myRef;
    if(typeof(fwdRef) === "function") fwdRef(ref.current);
    React.useEffect(() => {
        const tgt = ref.current;
        if(onUpdate) {
            tgt?.addEventListener("update", onUpdate);
        }
        return () => {
            if(onUpdate) {
                tgt?.removeEventListener("update", onUpdate);
            }
        }
    }, [ref, fwdRef, onUpdate]);
    return <text-editor ref={ref} {...rest}/>
});