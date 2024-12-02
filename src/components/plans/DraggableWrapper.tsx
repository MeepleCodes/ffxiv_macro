import React from "react"
import { Part, PartTypes } from "./plans"
import { KonvaEventObject } from "konva/lib/Node"
import { UpdateContext } from "./UpdateContext"

export type DraggableWrapperProps = {
  part: Part
}
export default function DraggableWrapper({part}: DraggableWrapperProps) {
  const {type, id, ...props} = part;
  const update = React.useContext(UpdateContext);

  const updateLocation = React.useCallback((e: KonvaEventObject<DragEvent>) => {
    const newSelf = {
      type,
      id,
      ...props,
      x: e.target.x(), y: e.target.y()
    };
    update(newSelf);
  }, [type, id, props, update]);
  const component = PartTypes[type].fn;
  return React.createElement(component, {
    ...props,
    draggable: true,
    onDragEnd: updateLocation
  });
}