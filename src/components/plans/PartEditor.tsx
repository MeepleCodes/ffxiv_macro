import { Group, KonvaNodeEvents } from "react-konva";
import AoEDonut from "../drawing/AoEDonut";
import { Part } from "./schemas"
import AoECircle from "../drawing/AoECircle";
import AoECone from "../drawing/AoECone";
import { PartChanger } from "./editable";
import { KonvaEventObject, Node } from "konva/lib/Node";
import { Group as KonvaGroup } from "konva/lib/Group";
import { canvasToGame, canvasToGameRotation, gameToCanvas } from "../../analysis/position";
import React from "react";

function roundToYalm(coord: number): number {
  return gameToCanvas(Math.round(canvasToGame(coord)));
}

export type PartEditorProps = {
  part: Part,
  changer?: PartChanger
} & KonvaNodeEvents;
const PartEditor = React.forwardRef(function PartEditor(props: PartEditorProps, ref: React.ForwardedRef<Node>) {
  const {part, changer, ...eventProps} = props;
  const id = part.id;
  const extraProps = {
    id,
    ref,
    ...eventProps,
  
    ...(changer ? {
      draggable: true,
      onDragMove: (evt: KonvaEventObject<DragEvent>) => {
        if(evt.evt.ctrlKey) {
          console.log("snapping to nearest yalm")
          evt.currentTarget.x(roundToYalm(evt.currentTarget.x()));
          evt.currentTarget.y(roundToYalm(evt.currentTarget.y()));          
        }
      },
      onDragEnd:  (evt: KonvaEventObject<DragEvent>) => {
        changer.onChange({
          ...part,
          x: canvasToGame(evt.currentTarget.x()),
          y: canvasToGame(evt.currentTarget.y())
        });
      },
      onTransformEnd: (evt: KonvaEventObject<Event>) => {
        console.log("Part transform end");
        const loc = {
          x: canvasToGame(evt.currentTarget.x()),
          y: canvasToGame(evt.currentTarget.y())
        };
        switch(part.type) {
          case "aoecone":
            changer.onChange({
              ...part,
              ...loc,
              facing: canvasToGameRotation(evt.currentTarget.rotation())
            });
            break;
          default:
            changer.onChange({...part, ...loc});
            break;
        }
      }
    } : {}),
  }

  switch(part.type) {
    case "aoedonut": {
      return <AoEDonut {...part} {...extraProps}/>
    }
    case "aoecircle": {
      return <AoECircle {...part} {...extraProps}/>
    }
    case "aoecone": {
      return <AoECone {...part} {...extraProps}/>
    }    
    case "group": {
      const children = part.children;
      const {ref, ...groupExtra} = extraProps;
      // Just have to lie about the type of ref, it's actually okay to put
      // a subclass into a superclass ref
      return <Group {...groupExtra} ref={ref as React.ForwardedRef<KonvaGroup>}>
        {children.map((part, i) => 
          <PartEditor
            part={part}
            key={part.id}
            changer={changer?.children[i]}
            {...extraProps}
          />
        )}
      </Group>
    }
    
  }
});
export default PartEditor;