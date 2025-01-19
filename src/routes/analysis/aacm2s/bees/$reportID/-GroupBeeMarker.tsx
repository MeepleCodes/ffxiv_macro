import { Circle, Group, Line, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { BeeCast } from '../bees.types';
import { logToCanvasCoord, logToCanvasRotation } from '../../../../../analysis/position';

export type GroupBeeMarkerProps = {
  number: number;
  cast: BeeCast;
  selected: boolean;
  wideLine: boolean;
  onMouseOver?(this: void, evt: Konva.KonvaEventObject<MouseEvent>): void;
  onMouseOut?(this: void, evt: Konva.KonvaEventObject<MouseEvent>): void;
  onClick?(this: void, evt: Konva.KonvaEventObject<MouseEvent>): void;
}
export function GroupBeeMarker(props: GroupBeeMarkerProps) {
  const {number, cast, selected, onClick, onMouseOver, onMouseOut, wideLine} = props;
  const colour = ["yellow", "orange", "brown", "red"][Math.floor((number-1)/4)];
  return <>
    <Group clipFunc={(ctx) => { ctx.arc(0, 0, 225 * 2.5, 0, Math.PI * 2); }}>
      {/* The line showing their facing */}
      <Line
        x={logToCanvasCoord(cast.sourceResources.x)}
        y={logToCanvasCoord(cast.sourceResources.y)}
        points={[0,0,0,-1500]}
        stroke={colour}
        opacity={0.8}
        strokeWidth={selected ? 5 : 1}
        dash={[10, 10]}
        rotation={logToCanvasRotation(cast.sourceResources.facing)}
      />
  </Group>
  {wideLine && <Group 
    clipFunc={(ctx) => { ctx.arc(0, 0, 450, 0, Math.PI * 2); }}
    >
    {/* The line showing the hit */}
    {/* <Line 
        x={gameToCanvas(cast.sourceResources.x)}
        y={gameToCanvas(cast.sourceResources.y)}
        points={[0,0,0,-22.5*(cast.abilityGameID === 39629 ? 50 : 45)]}
        stroke={colour}
        strokeWidth={22.5*(cast.abilityGameID === 39629 ? 8 : 10)}
        opacity={selected ? 0.4 : 0.2}
        rotation={gameToCanvasRotation(cast.sourceResources.facing)}
      /> */}
      <Rect
        x={logToCanvasCoord(cast.sourceResources.x)}
        y={logToCanvasCoord(cast.sourceResources.y)}
        width={22.5 * (cast.abilityGameID == 39629 ? 8 : 10)}
        height={22.5*(cast.abilityGameID === 39629 ? 50 : 45)}
        offsetX={22.5 * (cast.abilityGameID == 39629 ? 4 : 5)}
        rotation={logToCanvasRotation(cast.sourceResources.facing) + 180}
        fill={colour}
        opacity={selected ? 0.4 : 0.2}
        />
  </Group>}
  <Group onClick={onClick} onMouseOver={onMouseOver} onMouseOut={onMouseOut}         opacity={0.8}>
  <Circle
    x={logToCanvasCoord(cast.sourceResources.x)}
    y={logToCanvasCoord(cast.sourceResources.y)}
    stroke={colour}
    strokeWidth={selected ? 4 : 2}
    fill="grey"
    radius={selected ? 40 : 30}
    
    />
    <Text
      align="center"
      verticalAlign="middle"
      x={logToCanvasCoord(cast.sourceResources.x)-20}
      y={logToCanvasCoord(cast.sourceResources.y)-18}
      text={`${number}`}
      fontSize={24}
      width={40}
      stroke={colour}
      height={40}
      />
    </Group>
  </>
}