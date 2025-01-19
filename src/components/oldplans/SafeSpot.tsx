import { Layer, Rect } from "react-konva"
import { gameToCanvas, gameToCanvasDist } from "../../analysis/position"
import { RectConfig } from "konva/lib/shapes/Rect"
import React from "react";
import { Part, PartTypes } from "./plans";

export type SafeSpotProps = {
  walkable: {
    type: "rect",
    width: number,
    height: number
  }, // or allow custom shapes to replace the default <Rect> rendering
  children: Part[]
} & RectConfig;

/**
 * A part that renders the areas that are safe from one or more AoE effects.
 */
export default function SafeSpot(props: SafeSpotProps) {
  const {walkable, children, ...rectProps} = props;
  
  return (
    <Layer>
      <Rect
        x={gameToCanvas(100-(walkable.width/2))}
        y={gameToCanvas(100-(walkable.height/2))}
        width={gameToCanvasDist(walkable.width)}
        height={gameToCanvasDist(walkable.height)}
        {...rectProps}
      />
      {children.map(part => 
        React.createElement(PartTypes[part.type].fn, {key: part.id,  ...part, globalCompositeOperation: "destination-out"})
      )}
    </Layer>
  )
}