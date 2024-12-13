import { RingConfig } from "konva/lib/shapes/Ring";
import { Ring } from "react-konva";
import { gameToCanvas, gameToCanvasDist } from "../analysis/position";
import { Colour } from "./types";

export type AoEDonutProps = {
  x?: number,
  y?: number,
  innerRadius: number,
  outerRadius: number,
  colour: Colour,
  opacity: number
} & RingConfig;
export default function AoEDonut(props: AoEDonutProps) {
  const {x, y, innerRadius, outerRadius, colour, opacity, ...rest} = props;
  return <Ring
    x={gameToCanvas(x ?? 0)}
    y={gameToCanvas(y ?? 0)}
    innerRadius={gameToCanvasDist(innerRadius)}
    outerRadius={gameToCanvasDist(outerRadius)}
    fill={`rgba(${colour.r}, ${colour.g}, ${colour.b}, ${opacity})`}
    {...rest}
    />  
}
