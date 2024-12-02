import useImage from "use-image";
import { Circle, Group, Image, Text } from "react-konva";
import { Grayscale } from "konva/lib/filters/Grayscale";
import { GroupConfig } from "konva/lib/Group";
import { PlayerIcon } from "./markers";


export type PlayerMarkerProps = {
  x?: number,
  y?: number,
  icon?: PlayerIcon
  alive?: boolean
  size?: number
  iconOpacity?: number,
  style?: "round" | "square",
  label?: string
} & GroupConfig;
export default function PlayerMarker(props: PlayerMarkerProps) {
  const {
    icon,
    alive=true,
    size=40,
    iconOpacity=1,
    style="square",
    label,
    children,
    ...group
  } = props;
  const stroke = 4;
  const crop = 4;
  const [iconImage] = useImage(`${import.meta.env.BASE_URL}/icons/${icon}.png`);
  return (
    <Group
      
      filters={alive ? [] : [Grayscale]}
      opacity={0.8}
      {...group}
    >
      {children}
      {label !== undefined &&
      <Text
        text={label}
        align="center"
        verticalAlign="bottom"
        x={-size}
        width={size*2}
        y={-size*2.5}
        height={size*2}
        fontFamily="Arial"
        fontSize={20}
        fontStyle="bold"
        strokeWidth={1}
        stroke="white"
        fillAfterStrokeEnabled
      />
      }
      {style === "round" ? <>
      <Group
        clipFunc={(ctx) => {ctx.arc(0, 0, (size/2)-(stroke/2), 0, Math.PI * 2)}}
        >
        <Image
          image={iconImage}
          crop={{
            x: crop,
            y: crop,
            width: 64-(crop*2),
            height: 64-(crop*2)
          }}
          width={size}
          height={size}
          x={-(size/2)}
          y={-(size/2)}
          opacity={iconOpacity}
        />
      </Group>
      <Circle
        radius={size/2}
        strokeWidth={stroke}
        opacity={iconOpacity}
        stroke={alive ? "gold" : "gray"}
      />
      </> : <>
      <Image
          image={iconImage}
          width={size}
          height={size}
          opacity={iconOpacity}
          x={-(size/2)}
          y={-(size/2)}
        />
      </>}
    </Group>
  )
}