import { Circle } from "react-konva";
import { gameToCanvas, gameToCanvasDist } from "../../analysis/position";
import { CircleConfig } from "konva/lib/shapes/Circle";
import { AoEOmitShapeProps, AoEProps, colourToRGBA } from "./types";

export type AoECircleProps = AoEProps & {
  range: number,
} & AoEOmitShapeProps<CircleConfig, "radius">;
export default function AoECircle(props: AoECircleProps) {
  const {x, y, range, colour, opacity, ...rest} = props;
  return <Circle
    x={gameToCanvas(x ?? 0)}
    y={gameToCanvas(y ?? 0)}
    radius={gameToCanvasDist(range)}
    fill={colourToRGBA(colour, opacity)}
    {...rest}
  />;
}