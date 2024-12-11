import { Circle } from "react-konva";
import { gameToCanvas, gameToCanvasDist } from "../analysis/position";
import { CircleConfig } from "konva/lib/shapes/Circle";

export type AoECircleProps = {
  x?: number,
  y?: number,
  radius: number,
} & CircleConfig;
export default function AoECircle(props: AoECircleProps) {
  const {x, y, radius, ...rest} = props;
  return <Circle
    x={gameToCanvas(x ?? 0)}
    y={gameToCanvas(y ?? 0)}
    radius={gameToCanvasDist(radius)}
    fill="rgba(255, 0, 0, 0.2)"
    {...rest}
    />  
}
