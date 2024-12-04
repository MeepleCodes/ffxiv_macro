import { CircleConfig } from "konva/lib/shapes/Circle"
import { Arc, Group } from "react-konva";
import { gameToCanvas, gameToCanvasDist } from "../analysis/position";

export type HitBoxProps = {
  x: number,
  y: number,
  rotation?: number,
  radius: number
} & CircleConfig;

export default function HitBox(props: HitBoxProps) {
  const {x, y, radius, rotation=0, stroke="red", ...rest} = props;
  return <Group
    x={gameToCanvas(x)}
    y={gameToCanvas(y)}
    opacity={0.5}
    >
      <Arc
        angle={270}
        rotationDeg={rotation+135}
        innerRadius={gameToCanvasDist(radius)}
        outerRadius={gameToCanvasDist(radius)}
        stroke={stroke}
        strokeWidth={gameToCanvasDist(0.25)}
        shadowBlur={4}
        shadowForStrokeEnabled={true}
        shadowColor={stroke}
        shadowOpacity={1}
        {...rest}
      />
      <Arc
        angle={270}
        rotationDeg={rotation+135}
        innerRadius={gameToCanvasDist(radius-1)}
        outerRadius={gameToCanvasDist(radius-1)}
        stroke={stroke}
        strokeWidth={gameToCanvasDist(0.125)}
        shadowBlur={4}
        shadowForStrokeEnabled={true}
        shadowColor={stroke}
        shadowOpacity={1}
        {...rest}
      />
    </Group>
}