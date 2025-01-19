import { Group, Rect } from "react-konva";
import { gameToCanvas, gameToCanvasDist, gameToCanvasRotation } from "../../analysis/position";
import { AoEOmitShapeProps, AoEProps, colourToRGBA } from "./types";
import { RectConfig } from "konva/lib/shapes/Rect";

export type AoECrossProps = AoEProps & {
  facing: number,
  range: number,
  width: number,
} & AoEOmitShapeProps<RectConfig, "width"|"height">;
export default function AoECross(props: AoECrossProps) {
  const {x, y, facing=0, width, range, colour, opacity, ...rest} = props;
  const gWidth = gameToCanvasDist(width);
  const gRange = gameToCanvasDist(range);
  return (
    <Group
      x={gameToCanvas(x ?? 0)}
      y={gameToCanvas(y ?? 0)}
      rotation={gameToCanvasRotation(facing)}
    >
      <Rect
        x={-gRange}
        y={-gWidth/2}
        width={gRange * 2}
        height={gWidth}
        {...rest}
        fill={colourToRGBA(colour, opacity)}
      />
      <Rect
        x={-gWidth/2}
        y={-gRange}
        width={gWidth}
        height={gRange * 2}
        {...rest}
        fill={colourToRGBA(colour, opacity)}
      />      
    </Group>
  )
}
