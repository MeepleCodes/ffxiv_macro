import { Box, Checkbox, FormControlLabel, IconButton, Menu, MenuItem, Paper, Slider, Stack, Switch } from "@mui/material";
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import EventsTable from "./EventsTable";
import Arena from "./Arena";
import CastMarker from "./CastMarker";
import React from "react";
import ActorMarker from "./ActorMarker";
import { Layer } from "react-konva";

import aacm1s from "./aac/aacm1.jpg";
import aacm2s from "./aac/aacm2.jpg";
import aacm3s from "./aac/aacm3.jpg";
import aacm4s_p1 from "./aac/aacm4.p1.jpg";
import { Preset } from "ffxiv-client-data/uisave/FieldMarkers";
import WaymarkPicker from "./WaymarkPicker";
import Waymarks from "./Waymarks";
import Konva from "konva";
import { Event, Fight, Report } from "../../analysis/types";
import { LocatedActorInstance, LocatedEvent } from "./events";
import { Sidebar } from "../Sidebar";
import ReportCard from "./ReportCard";
import FightCard from "./FightCard";
import PlayerMarker from "./PlayerMarker";
import XIVAPI from "@xivapi/js";

let nextCopyId = 1;

export type ReplayProps = {
  report: Report;
  fight: Fight;
  backgroundImageUrl?: string;
  backgroundImageScale?: number;
};

type EventCopy = Omit<Event, "source"|"target"> & {
  source: LocatedActorInstance,
  target?: LocatedActorInstance,
  copyId: number
}

export default function Replay(props: ReplayProps) {
  const [open, setOpen] = React.useState(false);
  const [showPlayers, setShowPlayers] = React.useState(false);
  const [timestamp, setTimestamp] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [hovered, setHovered] = React.useState<Event|null>(null);
  const [waymarkPreset, setWaymarkPreset] = React.useState<Preset|null>(null);
  const [draggables, setDraggables] = React.useState<EventCopy[]>([]);
  const [contextMenu, setContextMenu] = React.useState<
    {top: number, left: number, event: LocatedEvent}|undefined
  >(undefined);
  

  const {report, fight } = props;
  const locator = fight.locator;
  const events = fight.events.map(event => new LocatedEvent(event, locator));
  const {backgroundImageUrl, backgroundImageScale} = React.useMemo(() => {
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
        case 96: {
          backgroundImageUrl = aacm4s_p1;
          break;
        }
        default: {
          fetch(
            `https://v2.xivapi.com/api/sheet/TerritoryType/${fight.zone.id}?fields=Map.Id%2COffsetZ%2CMap.SizeFactor`
          ).then(
            (response) => response.json()
          ).then(
            (json) => {
              let offsetZ = 0, sizeFactor = 100;
              try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                offsetZ = json.transient.OffsetZ as number;
              } catch {
                // no-op
              }
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              try { sizeFactor = json.fields.Map.fields.SizeFactor ?? 100 as number } catch { /**/}
              try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const mapId = json.fields.Map.fields.Id as string;
                // Default scale is 22.5px per yalm. Game maps are (sizeFactor/100) px/yalm
                const scale = 22.5 / (sizeFactor/100);
                console.log("Scaling to", scale, "from sizeFactor", sizeFactor);
                setBg({url: `https://v2.xivapi.com/api/asset/map/${mapId}`, scale, filter: true});
              } catch {
                console.log("No Map ID in response", json);
                return;
              }
              
            }
          ).catch((e: unknown) => {console.error("Failed to fetch map", e);})
        }
      }
    }
    return {backgroundImageUrl, backgroundImageScale};
  }, [props, fight.encounterID, fight.zone.id]);
  const [bg, setBg] = React.useState({url: backgroundImageUrl, scale: backgroundImageScale, filter: false});
  const [showBg, setShowBg] = React.useState(true);
  const handleRowClicked = React.useCallback((event: LocatedEvent) => {
    setSelected(selected => {
      return selected.symmetricDifference(new Set([event.id]));
    })
  }, [setSelected]);
  const isChecked = React.useCallback((event: LocatedEvent) => 
    selected.has(event.id)
  , [selected]);
  const handleAdd = () => {
    if(contextMenu !== undefined) {
      setDraggables(draggables => [...draggables, {copyId: nextCopyId++, ...contextMenu.event, source: contextMenu.event.source, target: contextMenu.event.target}])
      setContextMenu(undefined);
    }
  }
  const handleKonvaContext = (pointerEvent: Konva.KonvaEventObject<PointerEvent>, replayEvent: LocatedEvent) => {
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
    <Box sx={{
      zIndex: 1000,
        position: "absolute",
        top: 16,
        left: 200
    }}
    >
      <FormControlLabel control={<Switch checked={showBg} onChange={(_, checked) => {setShowBg(checked)}} />} label="Show background" />
      <WaymarkPicker
        sx={{
          
        }}
        waymarkPreset={waymarkPreset}
        setWaymarkPreset={setWaymarkPreset}
      />
    </Box>
    <Sidebar
      side="right"
      open={true}
      sx={{
        position: "fixed",
        right: 0,
        height: "100%",
        overflow: "visible",
        zIndex: (theme) => theme.vars.zIndex.drawer
      }}
      width={open ? "" : "400px"}
    >
      <IconButton
          size="small"
          onClick={() => { setOpen(!open) }}
          sx={{
            position: "absolute",
            left: "-34px",
            my: 1,
            top: 0,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            backgroundColor: (theme) => theme.vars.palette.background.paper,
            ["&:hover"]: {
              backgroundColor: (theme) => `rgba(${theme.vars.palette.dividerChannel} / 0.48)`
            }
          }}
        >
          {open ? <KeyboardArrowRightIcon/> : <KeyboardArrowLeftIcon/> }
        </IconButton>      
      <Stack direction="column" height="100%">
        <Box 
          display="flex"
          flexDirection="row"
          flexWrap="wrap"
          justifyContent="space-between"
          mx={1}
          py={1}
        >
          <Paper sx={{p:1, flex: 1}}><ReportCard report={report}/></Paper>
          <Paper sx={{p:1, flex: 1}}><FightCard fight={fight}/></Paper>
        </Box>
        <EventsTable
          events={events}
          fight={fight}
          report={report}
          onRowMouseOver={setHovered}
          onRowClicked={handleRowClicked}
          setTimestamp={setTimestamp}
          isChecked={isChecked}
          sx={{overflow: "auto", flex: 1}}
        />
      </Stack>
    </Sidebar>
    <Arena backgroundImageUrl={showBg?bg.url:undefined} backgroundImageScale={bg.scale} filterBackground={bg.filter}>

      <Layer name="castMarkers">
      {/* {hovered && <CastMarker cast={hovered}/>} */}

      {events.filter(event => selected.has(event.id)).map(event => <>
        {event.renderable() &&
          <CastMarker
            key={`cast-${event.id}`}
            cast={event}
            onContextMenu={(pointerEvent: Konva.KonvaEventObject<PointerEvent>) => handleKonvaContext(pointerEvent, event)}
          />
        }
      </>)}
      {/* {draggables.map(draggable => {
        const {copyId, ...event} = draggable;
        return <DraggableCastMarker key={`draggable-${copyId}`} cast={event} onDblClick={() => {console.log("Attempting to remove", copyId, "from draggables"); setDraggables(draggables => draggables.filter(d => d.copyId !== copyId))}}/>
      })} */}
      </Layer>
      <Layer name="hostileActorMarkers">
      {events.filter(event => selected.has(event.id)).map(event => 
        event.renderable() &&
          <ActorMarker key={`actor-${event.id}`} cast={event}/>
      )}
      </Layer>
      {showPlayers && <Layer name="players">
        {fight.actors.filter(actor => actor.type==="Player").map(player => {
          const located = fight.locator.estimateLocation(player.id, player.instance, timestamp, true);
          return located && <PlayerMarker 
            key={`${player.id}-${player.instance}`}
            {...located}
            icon={player.subType}
            label={player.name}
          />;
          }
        )}
      </Layer>}      
      <Layer name="waymarkers">
        {waymarkPreset && <Waymarks preset={waymarkPreset}/>}
      </Layer>
    </Arena>
    <Paper sx={{position: "absolute", bottom: "8px", right: "408px", left: "200px", px: 2}}>
      <FormControlLabel
        label="Show players"
        control={
          <Checkbox checked={showPlayers} onChange={(_, checked) => {setShowPlayers(checked)}}/>
          
        }
      />
      <Slider min={0} max={fight.endTime.diff(fight.startTime, "milliseconds")} value={timestamp} onChange={(_, value) => {setTimestamp(value as number)}}/>
    </Paper>
    </>
  )
}