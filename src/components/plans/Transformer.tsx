import { Transformer as KonvaTransformer, TransformerConfig } from "konva/lib/shapes/Transformer";
import { Transformer as TransformerComponent, Group as GroupComponent } from "react-konva";
import React from "react";
import { Group } from "konva/lib/Group";
import { Node } from "konva/lib/Node";

export type Handle = {
  transformerRef: React.RefObject<KonvaTransformer>,
  // groupRef: React.RefObject<Group>
}

export type TransformerProps = TransformerConfig & {
  children: React.ReactNode[]
}

const Transformer = React.forwardRef(function Transformer({children: children, ...rest}: TransformerProps, ref: React.ForwardedRef<Handle>) {
  const transformerRef = React.useRef<KonvaTransformer>(null);
  const groupRef = React.useRef<Group>(null);
  React.useImperativeHandle(ref, () => ({transformerRef}), [transformerRef]);
  function redraw() {
    if(arguments.length > 0 && arguments[0].type === "dragend") {
      console.log("Redrawing at transformer.dragend", transformerRef.current?.parent);
    }
    transformerRef.current?.nodes(groupRef.current !== null ? [groupRef.current] : []);
    transformerRef.current?.forceUpdate();
  }
  React.useEffect(redraw, []);
  return <>
    <TransformerComponent
      ref={transformerRef}
      draggable
      onDragMove={redraw}
      onDragEnd={redraw}
      {...rest}
    />
    <GroupComponent ref={groupRef}>
      {...children}
    </GroupComponent>
    </>
});
export default Transformer;