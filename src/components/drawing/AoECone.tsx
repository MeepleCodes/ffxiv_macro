import { gameToCanvas, gameToCanvasDist, gameToCanvasRotation } from "../../analysis/position";
import { AoEOmitShapeProps, AoEProps, colourToRGBA } from "./types";
import React from "react";
import { Cone, ConeConfig, ConeShape } from "./KonvaCone";
export type AoEConeProps = AoEProps & {
  facing?: number,
  range: number,
  angle: number,
} & AoEOmitShapeProps<ConeConfig, "innerRadius"|"outerRadius"|"angle"|"rotation"|"rotationDeg">;

export default function AoECone(props: AoEConeProps) {
  const {x, y, facing=0, angle, range, colour, opacity, ...rest} = props;
  const arcRef = React.useRef<ConeShape>(null);
  return <Cone
      ref={arcRef}
      radius={gameToCanvasDist(range)}
      angle={angle}
      fill={colourToRGBA(colour, opacity)}
      x={gameToCanvas(x ?? 0)}
      y={gameToCanvas(y ?? 0)}
      rotation={gameToCanvasRotation(facing)}
      {...rest}
      />  
  
}
