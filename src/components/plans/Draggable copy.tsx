import React from "react";
import { AnyPart, Part, PartType } from "./schemas";
import { KonvaEventObject, NodeConfig } from "konva/lib/Node";
import { KonvaNodeEvents } from "react-konva";
import { canvasToGame } from "../../analysis/position";

type _LocatedParts = {
  [key in PartType as Part<key> extends {location: unknown} ? key : never]: Part<key>
};
type LocatedTypeNames = keyof _LocatedParts;
type LocatedPart<T extends LocatedTypeNames> = _LocatedParts[T];

type PropsType<T extends LocatedTypeNames> = Omit<LocatedPart<T>, "location"> & NodeConfig & KonvaNodeEvents;

export type DraggableProps<T extends LocatedTypeNames> = {
  type: T,
  config: LocatedPart<T>,
  component: React.FunctionComponent<PropsType<T>>,
  onChange?: (newConfig: AnyPart) => void
}
export default function Draggable<T extends LocatedTypeNames>(props: DraggableProps<T>) {

  const konvaProps: PropsType<T> = {
    ...props.config.location,
    onDragEnd: (evt: KonvaEventObject<DragEvent>) => {
      props.onChange?.({...props.config, location: {x: canvasToGame(evt.currentTarget.x()), y: canvasToGame(evt.currentTarget.y())}})
    },
    ...props.config
  };
  return React.createElement<PropsType<T>>(props.component, konvaProps);
}