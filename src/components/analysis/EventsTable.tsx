import { Table, TableBody, TableCell, TableContainer as MuiTableContainer, TableContainerProps, TableHead, TableRow, styled, Link, tableRowClasses, tableCellClasses, Stack, Typography } from "@mui/material";
import { ReplayActorSnapshot, ReplayEvent } from "./events";
import { ReportFight } from "../../fflogs/reports";
import { logToCanvasRotation, logToGame, logToHumanRotation } from "./position";
import { fightTs } from "../../routes/analysis/aacm2s/bees/-utils";
import React from "react";

type EventsTableRowEvents = {
  onRowMouseOver?: React.Dispatch<ReplayEvent>;
  onRowMouseOut?: React.Dispatch<ReplayEvent>;
  onRowClicked?: React.Dispatch<ReplayEvent>;
}

export type EventsTableProps = {
  fight: ReportFight;
  events: ReplayEvent[];
  showStartCasts?: boolean;
  isChecked?: (event: ReplayEvent) => boolean;
} & EventsTableRowEvents & Omit<TableContainerProps, "children">;

type EventsTableRowProps = {
  fight: ReportFight;
  event: ReplayEvent;
  checked: boolean;
  combinedTime: boolean;
} & EventsTableRowEvents;

const TableContainer = styled(MuiTableContainer)(({theme}) => ({
  overflow: "auto",
  [`& .${tableCellClasses.head}`]: {
    background: theme.palette.background.paper
  },
  [`& .${tableRowClasses.root}:nth-of-type(odd):not(.Mui-selected)`]: {
    backgroundColor: theme.palette.action.focus
  }
}));


const EventsTableRow = React.memo(({event, fight, checked, combinedTime, onRowClicked}: EventsTableRowProps) => {
  const time = event.type === "cast" && combinedTime && event.action["Cast<100ms>"] > 0 ?
    `${fightTs(event.timestamp - (event.action["Cast<100ms>"] * 100.0), fight)} - ${fightTs(event.timestamp, fight)}` :
    fightTs(event.timestamp, fight);
  return (
    <TableRow key={event.id} selected={checked} onClick={() => {onRowClicked?.(event)}}>
      <TableCell>{time}</TableCell>
      <TableCell>
        <Actor actor={event.source}/>
      </TableCell>
      <TableCell>{event.type}</TableCell>
      <TableCell>
        {event.action.Name} (<Link href={`https://xivapi.com/Action/${event.action["#"]}`}>{event.action["#"]}</Link>)
      </TableCell>
      <TableCell>{event.target && <Actor actor={event.target}/>}</TableCell>
      <TableCell>{event.actionType}</TableCell>
      <TableCell>{event.action.CastType}</TableCell>
    </TableRow>
    )
})
export default function EventsTable(props: EventsTableProps) {
  const {fight, events, isChecked, showStartCasts, onRowClicked, onRowMouseOver: setHover, ...rest} = props;
  return (
    <TableContainer {...rest}>
      <Table stickyHeader size="small">
        <TableHead sx={{background: (theme) => theme.palette.background.paper}}>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Source</TableCell>
            <TableCell>What</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Target</TableCell>
            <TableCell>AType</TableCell>
            <TableCell>CType</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events.filter(event => event.type !== "begincast" || showStartCasts === true).map(event => <EventsTableRow
            key={event.id}
            checked={isChecked?.(event)==true}
            event={event}
            fight={fight}
            combinedTime={showStartCasts !== true}
            onRowClicked={onRowClicked}
            />            
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function Actor({actor}: {actor: ReplayActorSnapshot}) {
  const {x, y} = logToGame(actor);
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={actor.gameID >= 2_000_000 ? {color: (theme) => theme.palette.grey[500]} : {}}
    >
      <Typography
        sx={{flex: 1}}
        fontSize="inherit"
        title={`ID: ${actor.id}, game ID: ${actor.gameID}`}
      >
        {actor.instance === undefined ? 
          actor.name :
          `${actor.name} (${actor.instance})`
        }
      </Typography>
      <Stack direction="column" alignItems="center" title={`Raw: x=${actor.x}, y=${actor.y}, facing=${actor.facing}`}>
        <Typography fontSize="50%">({x.toFixed(2)}, {y.toFixed(2)})</Typography>
        <Typography fontSize="50%">{logToHumanRotation(actor.facing).toFixed(0)}&deg;</Typography>
      </Stack>
    </Stack>
  )
}