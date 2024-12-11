import React from "react";
import { AnyPart, Part, PartType } from "./schemas";
import { KonvaEventObject, NodeConfig } from "konva/lib/Node";
import { KonvaNodeEvents } from "react-konva";
import { canvasToGame } from "../analysis/position";

type _LocatedParts = {
  [key in PartType as Part<key> extends {location: unknown} ? key : never]: Part<key>
};
type LocatedTypeNames = keyof _LocatedParts;


type PropsType<T extends LocatedTypeNames> = NodeConfig & KonvaNodeEvents & Omit<Part<T>, "location"|"id"|"type">;

export type DraggableProps<T extends LocatedTypeNames> = {
  type: T,
  config: Part<T>,
  component: React.FunctionComponent<PropsType<T>>,
  onChange?: (newConfig: AnyPart) => void
}
export default function Draggable<T extends LocatedTypeNames>(props: DraggableProps<T>) {

  const konvaProps: PropsType<T> = {
    ...props.config.location,
    draggable: true,
    onDragEnd: (evt: KonvaEventObject<DragEvent>) => {
      console.log("Draggable drag ended, onChange is", props.onChange)
      props.onChange?.({...props.config, location: {x: canvasToGame(evt.currentTarget.x()), y: canvasToGame(evt.currentTarget.y())}})
    },
    ...props.config
  } as PropsType<T>;
  return React.createElement<PropsType<T>>(props.component, konvaProps);
}