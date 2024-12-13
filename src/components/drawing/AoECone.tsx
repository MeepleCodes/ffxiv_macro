import { Arc } from "react-konva";
import { gameToCanvas, gameToCanvasDist } from "../analysis/position";
import { ArcConfig } from "konva/lib/shapes/Arc";
import { Colour } from "./types";

export type AoEConeProps = {
  x?: number,
  y?: number,
  facing?: number,
  range: number,
  angle: number,
  colour: Colour,
  opacity: number
} & Omit<ArcConfig, "innerRadius"|"outerRadius"|"angle"|"rotation"|"rotationDeg"|"fill">;
export default function AoECone(props: AoEConeProps) {
  const {x, y, facing=0, angle, range, colour, opacity, ...rest} = props;
  return <Arc
    x={gameToCanvas(x ?? 0)}
    y={gameToCanvas(y ?? 0)}
    innerRadius={0}
    outerRadius={gameToCanvasDist(range)}
    angle={angle}
    rotationDeg={facing-angle/2}
    {...rest}
    fill={`rgba(${colour.r}, ${colour.g}, ${colour.b}, ${opacity})`}
    
    />  
}
