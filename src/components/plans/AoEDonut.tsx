import { RingConfig } from "konva/lib/shapes/Ring";
import { Ring } from "react-konva";
import { gameToCanvas, gameToCanvasDist } from "../analysis/position";

export type AoEDonutProps = {
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number
} & RingConfig;
export default function AoEDonut(props: AoEDonutProps) {
  const {x, y, innerRadius, outerRadius, ...rest} = props;
  return <Ring
    x={gameToCanvas(x)}
    y={gameToCanvas(y)}
    innerRadius={gameToCanvasDist(innerRadius)}
    outerRadius={gameToCanvasDist(outerRadius)}
    fill="rgba(255, 0, 0, 0.2)"
    {...rest}
    />  
}
