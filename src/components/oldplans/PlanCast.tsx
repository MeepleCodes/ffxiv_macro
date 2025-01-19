import { CircleConfig } from "konva/lib/shapes/Circle"
import { Circle } from "react-konva";
import { gameToCanvas, gameToCanvasDist } from "../../analysis/position";

export type PlanCastProps = {
  x: number,
  y: number,
  radius: number
} & CircleConfig;

export default function PlanCast(props: PlanCastProps) {
  const {x, y, radius, ...rest} = props;
  return <Circle
          fill="white"
          x={gameToCanvas(x)}
          y={gameToCanvas(y)}
          radius={gameToCanvasDist(radius)}
          {...rest}
        />  
}