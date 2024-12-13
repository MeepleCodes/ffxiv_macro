import { Circle } from "react-konva";
import { gameToCanvas, gameToCanvasDist } from "../analysis/position";
import { CircleConfig } from "konva/lib/shapes/Circle";
import { Colour } from "./types";

export type AoECircleProps = {
  x?: number,
  y?: number,
  radius: number,
  colour: Colour,
  opacity: number  
} & CircleConfig;
export default function AoECircle(props: AoECircleProps) {
  const {x, y, radius, colour, opacity, ...rest} = props;
  return <Circle
    x={gameToCanvas(x ?? 0)}
    y={gameToCanvas(y ?? 0)}
    radius={gameToCanvasDist(radius)}
    fill={`rgba(${colour.r}, ${colour.g}, ${colour.b}, ${opacity})`}
    {...rest}
    />  
}
