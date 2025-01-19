import React from "react";
import CastMarker, { CastMarkerProps } from "./CastMarker";
import { KonvaNodeEvents } from "react-konva";
import { Position } from "../../analysis/position";
import { NodeConfig } from "konva/lib/Node";

export default function DraggableCastMarker(props: CastMarkerProps & KonvaNodeEvents) {
  const [newPos, setNewPos] = React.useState<Position|undefined>(undefined);
  const [dragging, setDragging] = React.useState(false);
  const shapeProps: CastMarkerProps & KonvaNodeEvents & NodeConfig = {
    ...props,
    colour: {r: 127, g:0, b: 127},
    draggable: true,
    strokeWidth: 4,
    dash: [10, 10],
    opacity: dragging ? 0.8 : 0.6,
    onDragStart: () => {
      setDragging(true);
    },
    onDragEnd: (e) => {
      setNewPos({x: e.target.x(), y: e.target.y()})
      setDragging(false);
    }
  };
  if(newPos !== undefined) {
    shapeProps.x = newPos.x;
    shapeProps.y = newPos.y;
  }
  return <CastMarker {...shapeProps}/>
}