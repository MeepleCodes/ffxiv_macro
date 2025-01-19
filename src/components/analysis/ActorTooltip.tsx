import { Tooltip, Typography } from "@mui/material";
import { LocatedActorInstance } from "./events";
import { Jobs } from "../../excel/jobs";
import { colourToRGBA } from "../drawing/types";
import React from "react";

export type ActorTooltipProps = {
  actor: LocatedActorInstance
}

const ActorTooltip = React.memo(function ActorTooltipInner(props: ActorTooltipProps) {
  const {actor, ...rest} = props;
  const job = actor.type == "Player" && actor.subType in Jobs ?
    Jobs[actor.subType as keyof typeof Jobs] : undefined;
  const colour = job?.colour ??
    (actor.instance > 0 ?
      {r: 127, g: 127, b: 127} :
      {r: 255, g: 255, b: 255}
    );
  const icon = job?.icon;
  return (
    <Tooltip
      title={<>
        <Typography variant="h4">{actor.name}</Typography>
        <Typography variant="h6">{actor.subType}</Typography>

        {actor.location && <>Position: {actor.location.x},{actor.location.y}</>}
      </>}
      {...rest}
    >
      <Typography
        color={colourToRGBA(colour, 1)}
        fontWeight="bold"
        variant="body2"
        component="span"
      >
        {icon && <img src={`${import.meta.env.BASE_URL}/icons/${icon}.png`} width={16} height={16}/>}
        {actor.name}{actor.instance > 0 && <>({actor.instance})</>}
      </Typography>
    </Tooltip>
  )
});
export default ActorTooltip;