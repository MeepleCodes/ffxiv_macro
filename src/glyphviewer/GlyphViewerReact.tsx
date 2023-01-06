import React from 'react';
import HTMLGlyphViewerElement, { installWebComponent } from './GlyphViewer';
export { default as HTMLGlyphViewerElement } from './GlyphViewer';
interface TextEditorHTMLAttributes<T> extends Omit<React.HTMLAttributes<T>, "children"> {
    fontsrc: string | object;
    value?: string;
}
// React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
// type TextEditorAttributes<T> = React.HTMLAttributes<T> & Omit<TextEditor, keyof HTMLCustomElement>;
type GlyphViewerElementProps = React.DetailedHTMLProps<TextEditorHTMLAttributes<HTMLGlyphViewerElement>, HTMLGlyphViewerElement>;
declare global {
  namespace JSX {
    interface IntrinsicElements {
        ['glyph-viewer']: GlyphViewerElementProps
    }
  }
}
installWebComponent();

type GlyphViewerProps = GlyphViewerElementProps & {
    fontsrc: string | object;
    value?: string;
}

export default React.forwardRef<HTMLGlyphViewerElement, GlyphViewerProps>((props: GlyphViewerProps, fwdRef: React.ForwardedRef<HTMLGlyphViewerElement>) => {
    const {...rest} = props;
    const myRef = React.useRef<HTMLGlyphViewerElement>(null);
    const ref = (fwdRef!== null && typeof(fwdRef) !== "function") ? fwdRef : myRef;
    if(typeof(fwdRef) === "function") fwdRef(ref.current);
    React.useEffect(() => {
        const tgt = ref.current;
        // if(onSelectionChange) {
        //     tgt?.addEventListener("selectionchange", onSelectionChange);
        // }
        // return () => {
        //     if(onSelectionChange) {
        //         tgt?.removeEventListener("selectionchange", onSelectionChange);
        //     }
        // }
    }, [ref, fwdRef, /*onSelectionChange*/]);
    return <glyph-viewer ref={ref} {...rest}/>
});