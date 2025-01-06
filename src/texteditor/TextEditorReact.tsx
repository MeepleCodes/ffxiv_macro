import React from 'react';
import HTMLTextEditorElement, { installWebComponent } from './TextEditor';
export { default as HTMLTextEditorElement } from './TextEditor';

/**
 * The attributes we want to accept for a <text-editor/> tag, which is
 * a) Everything from a generic HTMLElement tag except 'children'
 * b) The custom attributes we added in the web component
 */
interface TextEditorHTMLAttributes<T> extends Omit<React.HTMLAttributes<T>, "children"> {
    fontsrc: string | object;
    value?: string;
    scale?: number;
    class?: string;
    showWhitespace?: boolean;
}
/**
 * React props list for a <text-editor/> tag, which is derived from the TextEditorHTMLAttributes.
 */
type TextEditorElementProps = React.DetailedHTMLProps<TextEditorHTMLAttributes<HTMLTextEditorElement>, HTMLTextEditorElement>;
declare global {
  // Can't find the way to do this with ES2015 modules so fuck it
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
        //DetailedHTMLProps<CanvasHTMLAttributes<HTMLCanvasElement>, HTMLCanvasElement> 
        ['text-editor']: TextEditorElementProps
    }
  }
}


// Install/register the <text-editor/> web component
installWebComponent();


/**
 * Props for our wrapper <TextEditor/> component, which adds event handler properties.
 */
type TextEditorProps = TextEditorElementProps & {
    onSelectionChange?: (ev: Event) => unknown;
    onChange?: (ev: Event) => unknown;
    
}

const TextEditor = React.forwardRef<HTMLTextEditorElement, TextEditorProps>((props: TextEditorProps, fwdRef: React.ForwardedRef<HTMLTextEditorElement|null>) => {
    const {onSelectionChange, onChange, showWhitespace, className, ...rest} = props;
    const myRef = React.useRef<HTMLTextEditorElement>(null);
    React.useImperativeHandle<HTMLTextEditorElement|null, HTMLTextEditorElement|null>(fwdRef, () => myRef.current);
    React.useEffect(() => {
        const tgt = myRef.current;
        if(onSelectionChange) {
            tgt?.addEventListener("selectionchange", onSelectionChange);
        }
        if(onChange) {
            tgt?.addEventListener("change", onChange);
        }
        return () => {
            if(onSelectionChange) {
                tgt?.removeEventListener("selectionchange", onSelectionChange);
            }
            if(onChange) {
                tgt?.removeEventListener("change", onChange);
            }
        }
    }, [myRef, onSelectionChange, onChange]);
    return <text-editor class={className} ref={myRef} show-whitespace={showWhitespace == true ? "" : null} {...rest}/>
});
export default TextEditor;