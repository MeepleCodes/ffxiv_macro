import { ShapeConfig } from "konva/lib/Shape";
import { RenderableEvent } from "./events";
import { Circle, Group, Line } from "react-konva";
import { gameToCanvas, gameToCanvasDist, gameToCanvasRotation } from "../../analysis/position";

export type ActorMarkerProps = {
  cast: RenderableEvent
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
  const x = gameToCanvas(cast.source.location.x);
  const y = gameToCanvas(cast.source.location.y);
  const facing = gameToCanvasRotation(cast.source.location.facing);
  const drawRadius = gameToCanvasDist(hitbox);
  return (
    <Group
      x={x}
      y={y}
      rotation={facing}
    >
      <Circle radius={drawRadius} {...shapeProps}/>
      <Line points={[drawRadius, 10, drawRadius+10, 0, drawRadius, -10]} {...shapeProps}/>

    </Group>

  )
}