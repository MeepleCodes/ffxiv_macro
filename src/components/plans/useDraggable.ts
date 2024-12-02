import React from "react";
import { KonvaEventObject, NodeConfig } from "konva/lib/Node";
import { canvasToGame } from "../analysis/position";

export interface Draggable {
  dragging: boolean;
  dragProps: NodeConfig;
}

export default function useDraggable(x: number, y: number, onLocationChanged?: (canvasX: number, canvasY: number, gameX: number, gameY: number) => void): Draggable {
  const [location, setLocation] = React.useState({x, y});
  const [dragging, setDragging] = React.useState(false);
  const handleStart = React.useCallback(() => {
    setDragging(true);
  }, [setDragging]);
  const handleEnd = React.useCallback((e: KonvaEventObject<DragEvent>) => {
    setDragging(false);
    const newLoc = {x: e.target.x(), y: e.target.y()};
    setLocation(newLoc);
    if(onLocationChanged) {
      onLocationChanged(
        newLoc.x,
        newLoc.y,
        canvasToGame(newLoc.x),
        canvasToGame(newLoc.y)
      );
    }
  }, [setDragging, setLocation, onLocationChanged]);
  return {
    dragging,
    dragProps: {
      draggable: true,
      onDragStart: handleStart,
      onDragEnd: handleEnd,
      x: location.x,
      y: location.y
    }
  }
}