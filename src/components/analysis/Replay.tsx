import { Box, Drawer, IconButton, Menu, MenuItem, Toolbar } from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Action } from "../../excel/Action";
import { Locator } from "../../fflogs/locator";
import { Report, ReportFight } from "../../fflogs/reports";
import { Event } from "../../fflogs/types";
import { fromReport, ReplayEvent } from "./events";
import EventsTable from "./EventsTable";
import Arena from "./Arena";
import CastMarker from "./CastMarker";
import React from "react";
import ActorMarker from "./ActorMarker";
import { Layer } from "react-konva";
import { bindContextMenu, bindMenu, usePopupState } from "material-ui-popup-state/hooks";

import aacm1s from "./aac/aacm1.jpg";
import aacm2s from "./aac/aacm2.jpg";
import aacm3s from "./aac/aacm3.jpg";
import useWaymarkLoader from "../../waymarks/useWaymarkLoader";
import { Preset } from "ffxiv-client-data/uisave/FieldMarkers";
import WaymarkPicker from "./WaymarkPicker";
import Waymarks from "./Waymarks";
import Konva from "konva";
import DraggableCastMarker from "./DraggableCastMarker";

let nextCopyId = 1;

export type ReplayProps = {
  actions: (Action|null)[];
  events: Event[];
  locator: Locator;
  meta: Report;
  fight: ReportFight;
  backgroundImageUrl?: string;
  backgroundImageScale?: number;
};

type EventCopy = ReplayEvent & {
  copyId: number
}

export default function Replay(props: ReplayProps) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [hovered, setHovered] = React.useState<ReplayEvent|null>(null);
  const [waymarkPreset, setWaymarkPreset] = React.useState<Preset|null>(null);
  const [draggables, setDraggables] = React.useState<EventCopy[]>([]);
  const [contextMenu, setContextMenu] = React.useState<{top: number, left: number, event: ReplayEvent}|undefined>(undefined);
  

  const {locator, fight } = props;
  let {backgroundImageUrl, backgroundImageScale} = props;
  if(backgroundImageUrl === undefined) {
    switch(fight.encounterID) {
      case 93: {
        backgroundImageUrl = aacm1s;
        break;
      }
      case 94: {
        backgroundImageUrl = aacm2s;
        break;
      }
      case 95: {
        backgroundImageUrl = aacm3s;
        backgroundImageScale = 0.75;
        break;
      }      
    }
  }
  const events = React.useMemo(() => 
    props.events.map(
      (rawEvent) => {
        try {
          return fromReport(rawEvent, props.meta, props.actions, locator);
        } catch(e) {
          console.log(e)
          return null;
        }
      }
    ).filter(event => event !== null)
  ,[props.events, props.meta, props.actions, locator]);
  const handleRowClicked = React.useCallback((event: ReplayEvent) => {
    setSelected(selected => {
      return selected.symmetricDifference(new Set([event.id]));
    })
  }, [setSelected]);
  const isChecked = React.useCallback((event: ReplayEvent) => 
    selected.has(event.id)
  , [selected]);
  const handleAdd = () => {
    if(contextMenu !== undefined) {
      setDraggables(draggables => [...draggables, {copyId: nextCopyId++, ...contextMenu.event}])
      setContextMenu(undefined);
    }
  }
  const handleKonvaContext = (pointerEvent: Konva.KonvaEventObject<PointerEvent>, replayEvent: ReplayEvent) => {
    setContextMenu({
      top: pointerEvent.evt.clientY,
      left: pointerEvent.evt.clientX,
      event: replayEvent
    });
    pointerEvent.evt.preventDefault();
    return false;
  }
  
  return (
    <>
    <Menu
      open={contextMenu !== undefined}
      onClose={() => {setContextMenu(undefined)}}
      anchorReference="anchorPosition"
      anchorPosition={contextMenu}
    >
      <MenuItem onClick={handleAdd}>Make moveable copy</MenuItem>
    </Menu>
    <WaymarkPicker
      sx={{
        zIndex: 1000,
        position: "absolute",
        top: 16,
        left: 160
      }}
      waymarkPreset={waymarkPreset}
      setWaymarkPreset={setWaymarkPreset}
    />
    <Drawer
      open={true}
      variant="permanent"
      anchor="right"
      PaperProps={{
        sx: {
          width: open ? undefined : 400,
          overflow: "hidden"
        }
      }}
    >
      <Toolbar variant="dense">
        <IconButton onClick={() => {setOpen(!open)}} color="primary">
          {open ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Toolbar>
      <EventsTable
        events={events}
        fight={fight}
        onRowMouseOver={setHovered}
        onRowClicked={handleRowClicked}
        isChecked={isChecked}
        sx={{overflow: "auto", flex: 1}}/>
    </Drawer>
    <Arena backgroundImageUrl={backgroundImageUrl} backgroundImageScale={backgroundImageScale}>
      <Layer name="castMarkers">
      {hovered && <CastMarker cast={hovered}/>}

      {events.filter(event => selected.has(event.id)).map(event => <>
        <CastMarker key={`cast-${event.id}`} cast={event} onContextMenu={(pointerEvent: Konva.KonvaEventObject<PointerEvent>) => handleKonvaContext(pointerEvent, event)}/>
      </>)}
      {draggables.map(draggable => {
        const {copyId, ...event} = draggable;
        return <DraggableCastMarker key={`draggable-${copyId}`} cast={event} onDblClick={() => {console.log("Attempting to remove", copyId, "from draggables"); setDraggables(draggables => draggables.filter(d => d.copyId !== copyId))}}/>
      })}
      </Layer>
      <Layer name="hostileActorMarkers">
      {events.filter(event => selected.has(event.id)).map(event => <>
        <ActorMarker key={`actor-${event.id}`} cast={event}/>
      </>)}
      </Layer>
      <Layer name="waymarkers">
        {waymarkPreset && <Waymarks preset={waymarkPreset}/>}
      </Layer>
      {/* {events.map((event, i) => 
        <CastMarker key={i} cast={event}/>
      )} */}
    </Arena>
    </>
  )
}