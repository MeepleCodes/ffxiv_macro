import React from 'react';
import HTMLGlyphViewerElement, { installWebComponent } from './GlyphViewer';
export { default as HTMLGlyphViewerElement } from './GlyphViewer';
interface TextEditorHTMLAttributes<T> extends Omit<React.HTMLAttributes<T>, "children"> {
    fontsrc: string | object;
    value?: string;
    scale?: number;
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
    onSelectionChange?: (ev: Event) => any;
}

export default React.forwardRef<HTMLGlyphViewerElement, GlyphViewerProps>(function GlyphViewer(props: GlyphViewerProps, fwdRef: React.ForwardedRef<HTMLGlyphViewerElement|null>) {
    const {onSelectionChange, ...rest} = props;
    const myRef = React.useRef<HTMLGlyphViewerElement>(null);
    React.useImperativeHandle<HTMLGlyphViewerElement|null, HTMLGlyphViewerElement|null>(fwdRef, () => myRef.current);
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
    return <glyph-viewer ref={myRef} {...rest}/>
});