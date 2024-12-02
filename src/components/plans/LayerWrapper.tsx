import React from "react"
import { Part } from "./plans"
import { KonvaEventObject } from "konva/lib/Node"
import { UpdateContext } from "./UpdateContext"
import DraggableWrapper from "./DraggableWrapper"
import { LayerConfig } from "konva/lib/Layer"
import { Layer } from "react-konva"

export type LayerWrapperProps = {
  children: Part[]
} & LayerConfig;
export default function LayerWrapper({children}: LayerWrapperProps) {
  return <Layer>
      {children.map(part => 
        // isDraggable(part) ?
        <DraggableWrapper key={part.id} part={part}/>
        //: React.createElement(PartTypes[part.type].fn, {key: part.id, ...part})
      )}
  
  </Layer>
}