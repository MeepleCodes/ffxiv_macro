import { Marker, MarkerColour, MarkerShape, Preset, PresetMarker } from "ffxiv-client-data/uisave/FieldMarkers";
import { Circle, Group, Line, Rect } from "react-konva";
import Konva from "konva";
import { gameToCanvas, gameToCanvasDist } from "./position";

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

function Waymark({mark, sizePx = 50}: {mark: PresetMarker, sizePx?: number}) {
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

export default function Waymarks({preset}: {preset: Preset}) {
  return (
    <Group>
      {preset.markers.filter(mark => mark.enabled).map(mark =>
        <Waymark mark={mark} key={`${preset.created.toISOString()}-${mark.marker.name}`}/>
      )}
    </Group>
  )
}