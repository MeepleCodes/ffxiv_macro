import { RingConfig } from "konva/lib/shapes/Ring";
import { Ring } from "react-konva";
import { gameToCanvas, gameToCanvasDist } from "../../analysis/position";
import { AoEOmitShapeProps, AoEProps, colourToRGBA } from "./types";

export type AoEDonutProps = AoEProps & {
  innerRadius: number,
  outerRadius: number,
} & AoEOmitShapeProps<RingConfig>;
export default function AoEDonut(props: AoEDonutProps) {
  const {x, y, innerRadius, outerRadius, colour, opacity, ...rest} = props;
  return <Ring
    x={gameToCanvas(x ?? 0)}
    y={gameToCanvas(y ?? 0)}
    innerRadius={gameToCanvasDist(innerRadius)}
    outerRadius={gameToCanvasDist(outerRadius)}
    fill={colourToRGBA(colour, opacity)}
    {...rest}
    />  
}
