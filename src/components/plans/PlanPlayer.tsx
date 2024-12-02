
import PlayerMarker, { PlayerMarkerProps } from "../analysis/PlayerMarker";
import React from "react";
import { ImageConfig } from "konva/lib/shapes/Image";
import { Circle, Image } from "react-konva";
import { CircleConfig } from "konva/lib/shapes/Circle";
import { gameToCanvasDist } from "../analysis/position";
import useImage from "use-image";

export type PlanPlayerProps = PlayerMarkerProps & {
  extraIcon?: Omit<ImageConfig, "image"> & {image: string},
  aeMarker?: CircleConfig
}

/**
 * Extension of PlayerMarker that adds some commonly used extra features, like
 * an icon over their head and an AE marker that follows them.
 */
export default function PlanPlayer(props: PlanPlayerProps) {
  const {
    extraIcon,
    aeMarker,
    ...rest
  } = props;
  const [iconImage] = useImage(`${import.meta.env.BASE_URL}${extraIcon?.image}`);
  const imageProps = extraIcon  && {
    ...extraIcon,
    image: iconImage
  }
  const aeProps = aeMarker && {
    stroke: "red",
    strokeWidth: 2,
    opacity: 0.8,
    dash: [10, 10],
    ...aeMarker,
    radius: gameToCanvasDist(aeMarker.radius ?? 0),
  };
  console.log("Turned aeMarker", aeMarker, "into aeProps", aeProps);
  return <PlayerMarker
    {...rest}
    >
      {imageProps &&
      <Image
        {...imageProps}
      />
      }
      {aeProps && 
      <Circle
        {...aeProps}
      />
      }
  <Circle
  />
</PlayerMarker>
}