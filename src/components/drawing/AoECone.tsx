import { Arc } from "react-konva";
import { gameToCanvas, gameToCanvasDist } from "../analysis/position";
import { ArcConfig } from "konva/lib/shapes/Arc";

export type AoEConeProps = {
  x?: number,
  y?: number,
  facing?: number,
  range: number,
  angle: number,
} & Omit<ArcConfig, "innerRadius"|"outerRadius"|"angle"|"rotation"|"rotationDeg">;
export default function AoECone(props: AoEConeProps) {
  const {x, y, facing=0, angle, range, ...rest} = props;
  return <Arc
    x={gameToCanvas(x ?? 0)}
    y={gameToCanvas(y ?? 0)}
    innerRadius={0}
    outerRadius={gameToCanvasDist(range)}
    angle={angle}
    rotationDeg={facing-angle/2}
    {...rest}
    fill="rgba(255, 0, 0, 0.2)"
    
    />  
}
