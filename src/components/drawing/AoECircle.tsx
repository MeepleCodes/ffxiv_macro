import { Circle } from "react-konva";
import { gameToCanvas, gameToCanvasDist } from "../../analysis/position";
import { Circle as KonvaCircle, CircleConfig } from "konva/lib/shapes/Circle";
import { AoEOmitShapeProps, AoEProps, colourToRGBA } from "./types";
import React from "react";
import { Node } from "konva/lib/Node";

export type AoECircleProps = AoEProps & {
  radius: number,
} & AoEOmitShapeProps<CircleConfig, "radius">;
export default function AoECircle(props: AoECircleProps) {
  const {x, y, radius, colour, opacity, ...rest} = props;
  return <Circle
    x={gameToCanvas(x ?? 0)}
    y={gameToCanvas(y ?? 0)}
    radius={gameToCanvasDist(radius)}
    fill={colourToRGBA(colour, opacity)}
    {...rest}
  />;
}