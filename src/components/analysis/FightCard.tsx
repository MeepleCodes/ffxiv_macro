import { Box, Link, Stack, StackProps, Typography } from "@mui/material"
import { Fight, Report } from "../../analysis/types"
import { RouteLink } from "../Links"

import { Route as FightIDRoute } from '../../routes/analysis/$reportID/$fightID';
import TextLabel from "./TextLabel";
import dayjs, { Dayjs } from "dayjs";

export type FightCardProps = StackProps & {
  fight: Fight
}
export default function FightCard({fight, ...rest}: FightCardProps) {
  return <Stack direction="column" {...rest}>
      <Typography variant="overline" display="flex" sx={{lineHeight: "inherit"}}>
      <TextLabel fontWeight="normal">Fight number</TextLabel>
        <RouteLink
          to={FightIDRoute.to}
          params={{reportID: fight.reportID, fightID: fight.fightNumber}}
          fontWeight="bold"
          underline="hover"
        >
          {fight.fightNumber}
        </RouteLink>
        <Box sx={{flex: 1}}/>
      </Typography>
      <Typography variant="h5">{fight.name}</Typography>
      <Typography variant="subtitle1">{fight.zone.name}</Typography>
      <Typography variant="subtitle2">
        <TextLabel fontWeight="normal">Started</TextLabel> {fight.startTime.toString()}
      </Typography>
      <Typography variant="subtitle2">
        <TextLabel fontWeight="normal">Combat time</TextLabel> {dayjs.duration(fight.combatTime, "milliseconds").format("m:s")}
      </Typography>
      <Typography variant="subtitle2">
        <TextLabel fontWeight="normal">Boss HP%</TextLabel> {fight.bossPercentage}%
      </Typography>
  </Stack>
}