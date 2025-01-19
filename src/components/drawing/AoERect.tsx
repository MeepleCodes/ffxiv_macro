import { Rect } from "react-konva";
import { gameToCanvas, gameToCanvasDist, gameToCanvasRotation } from "../../analysis/position";
import { AoEOmitShapeProps, AoEProps, colourToRGBA } from "./types";
import { RectConfig } from "konva/lib/shapes/Rect";

export type AoERectProps = AoEProps & {
  facing: number,
  range: number,
  width: number,
  variant?: "forward" | "through"
} & AoEOmitShapeProps<RectConfig, "width"|"height"|"rotation">;
export default function AoERect(props: AoERectProps) {
  const {x, y, facing=0, variant="forward", width, range, colour, opacity, ...rest} = props;
  return <Rect
    x={gameToCanvas(x ?? 0)}
    y={gameToCanvas((y ?? 0))}
    offsetY={gameToCanvasDist(width)/2}
    offsetX={variant === "forward" ? 0 : gameToCanvasDist(range)/2}
    width={gameToCanvasDist(range)}
    height={gameToCanvasDist(width)}
    rotation={gameToCanvasRotation(facing)}
    {...rest}
    fill={colourToRGBA(colour, opacity)}
    
    />  
}
