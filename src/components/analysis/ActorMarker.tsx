import { ShapeConfig } from "konva/lib/Shape";
import { ReplayEvent } from "./events";
import { Circle, Group, Line } from "react-konva";
import { gameToCanvasDist, logToCanvasCoord, logToCanvasRotation } from "./position";

export type ActorMarkerProps = {
  cast: ReplayEvent
  hitbox?: number
} & ShapeConfig;

export default function ActorMarker(props: ActorMarkerProps) {
  const {cast, hitbox=1, ...rest} = props;
  const shapeProps = {
    stroke: "#200000",
    strokeWidth: 3,
    opacity: 1,
    fill: "#ffa0a0",
    ...rest
  }
  const x = logToCanvasCoord(cast.source.x);
  const y = logToCanvasCoord(cast.source.y);
  const facing = logToCanvasRotation(cast.source.facing);
  const drawRadius = gameToCanvasDist(hitbox);
  return (
    <Group
      x={x}
      y={y}
      rotation={facing}
    >
      <Circle radius={drawRadius} {...shapeProps}/>
      <Line points={[10, drawRadius, 0, drawRadius+10, -10, drawRadius]} {...shapeProps}/>

    </Group>

  )
}