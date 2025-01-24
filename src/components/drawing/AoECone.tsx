import { Arc, Group } from "react-konva";
import { gameToCanvas, gameToCanvasDist, gameToCanvasRotation } from "../../analysis/position";
import { ArcConfig } from "konva/lib/shapes/Arc";
import { AoEOmitShapeProps, AoEProps, colourToRGBA } from "./types";

export type AoEConeProps = AoEProps & {
  facing?: number,
  range: number,
  angle: number,
} & AoEOmitShapeProps<ArcConfig, "innerRadius"|"outerRadius"|"angle"|"rotation"|"rotationDeg">;
export default function AoECone(props: AoEConeProps) {
  const {x, y, facing=0, angle, range, colour, opacity, ...rest} = props;
  return <Group
    x={gameToCanvas(x ?? 0)}
    y={gameToCanvas(y ?? 0)}
    rotation={gameToCanvasRotation(facing)}
    {...rest}
  >
    <Arc
      innerRadius={0}
      outerRadius={gameToCanvasDist(range)}
      angle={angle}
      rotation={-angle/2}
      
      fill={colourToRGBA(colour, opacity)}
      
      />  
    </Group>
}
