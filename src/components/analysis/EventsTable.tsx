import { Table, TableBody, TableCell, TableContainer as MuiTableContainer, TableContainerProps, TableHead, TableRow, styled, tableRowClasses, tableCellClasses, Typography, Link } from "@mui/material";
import React from "react";
import { LocatedEvent } from "./events";
import { Fight, formatTimestamp, Report } from "../../analysis/types";
import ActorTooltip from "./ActorTooltip";
import ActionTooltip from "./ActionTooltip";

type EventsTableRowEvents = {
  onRowMouseOver?: React.Dispatch<LocatedEvent>;
  onRowMouseOut?: React.Dispatch<LocatedEvent>;
  onRowClicked?: React.Dispatch<LocatedEvent>;
  setTimestamp?: React.Dispatch<React.SetStateAction<number>>;
}

export type EventsTableProps = {
  report: Report,
  fight: Fight,
  events: LocatedEvent[],
  setTimestamp?: React.Dispatch<React.SetStateAction<number>>,
  isChecked?: (event: LocatedEvent) => boolean
} & EventsTableRowEvents & Omit<TableContainerProps, "children">;

type EventsTableRowProps = {
  fightStart: number,
  event: LocatedEvent,
  checked: boolean
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


const EventsTableRow = React.memo(({fightStart, event, checked, onRowClicked, setTimestamp}: EventsTableRowProps) => {
  const castStart = event.ability.cast100ms > 0 ?
    event.timestamp - (event.ability.cast100ms * 100.0) :
    undefined;
  return (
    <TableRow key={event.id} selected={checked} onClick={() => {onRowClicked?.(event)}}>
      <TableCell sx={{whiteSpace: "nowrap", textAlign: "right"}}>
        {castStart !== undefined &&
          <Typography variant="inherit" component="span" sx={{color: "#808080"}}>
            ({formatTimestamp(castStart)}) &nbsp;
          </Typography>
        }
        <Link href="#" title={`${event.timestamp}ms since fight start; ${event.timestamp + fightStart}ms since report start`} onClick={(e) => {setTimestamp?.(event.timestamp);e.stopPropagation();e.preventDefault(); }} >{formatTimestamp(event.timestamp)}</Link>
      </TableCell>
      <TableCell sx={{whiteSpace: "nowrap"}}> 
        <ActorTooltip actor={event.source}/>&nbsp;
        {event.type}&nbsp;
        <ActionTooltip action={event.ability}/>
        {event.target && (
          event.target.id === event.source.id && event.target.instance === event.source.instance ?
          <>⤞ (self)</> :
          <>&nbsp;⤞&nbsp;<ActorTooltip actor={event.target}/></>
        )}
      </TableCell>
    </TableRow>
    )
})
export default function EventsTable(props: EventsTableProps) {
  const {report, fight, events, isChecked, onRowClicked, onRowMouseOver: setHover, setTimestamp, ...rest} = props;
  const fightStart = fight.startTime.diff(report.startTime, "milliseconds");
  return (
    <TableContainer {...rest}>
      <Table
        stickyHeader
        size="small"
        sx={{
          "& td, & th": {
            px: 1
          }
        }}
      >
        <TableHead sx={{background: (theme) => theme.palette.background.paper}}>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Event</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events.map(event => <EventsTableRow
            key={event.id}
            fightStart={fightStart}
            checked={isChecked?.(event)==true}
            event={event}
            onRowClicked={onRowClicked}
            setTimestamp={setTimestamp}
            />            
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
