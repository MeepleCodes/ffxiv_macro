import { MarkerColour, MarkerShape, PresetMarker } from "ffxiv-client-data/uisave/FieldMarkers";
import { Circle, Group, Rect } from "react-konva";
import Konva from "konva";
import { gameToCanvas } from "../../analysis/position";


const COLOUR_MAP: Record<MarkerColour, string> = {
  [MarkerColour.RED]: "#F35A78",
  [MarkerColour.YELLOW]: "#F9E74A",
  [MarkerColour.BLUE]: "cyan",
  [MarkerColour.PURPLE]: "#7F2AD4"
}

function opacify(colour: string, opacity: number): string {
  const rgb = Konva.Util.getRGB(colour);
  if(opacity < 0 || opacity > 1) throw Error("Opacity should be in range 0.0-1.0");
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * 100}%)`;
}

export type WaymarkProps = {
  x: number,
  y: number,
  facing: number,
  sizePx: number,
  mark: 
}

export default function Waymark({mark, sizePx = 50}: {mark: PresetMarker, sizePx?: number}) {
  const colour = COLOUR_MAP[mark.marker.colour];
  const formatting = {
    stroke: opacify(colour, 0.8),
    strokeWidth: 2,
    fill: opacify(colour, 0.5)
  };
  return (
    <Group
      x={gameToCanvas(mark.x)}
      y={gameToCanvas(mark.z)}
    >
      {mark.marker.shape === MarkerShape.CIRCLE ?
      <Circle
        radius={sizePx/2}
        {...formatting}
      />
      :<>
      <Rect
        x={-sizePx/2}
        y={-sizePx/2}
        width={sizePx}
        height={sizePx}
        {...formatting}
      /> 
        {/* <Line points={[-sizePx/2, -sizePx/2, sizePx/2, sizePx/2]} {...formatting} />
        <Line points={[sizePx/2, -sizePx/2, -sizePx/2, sizePx/2]} {...formatting} /> */}
      </>
      }
    </Group>
  )
}
