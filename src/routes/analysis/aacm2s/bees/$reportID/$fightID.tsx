import { createFileRoute } from '@tanstack/react-router'
import { Circle, Group, Image, Layer, Stage } from 'react-konva';
import useImage from 'use-image';
import bgPath from "../../aacm2.jpg";
import React from 'react';
import { Box, Checkbox, FormControlLabel, List, ListItemAvatar, ListItemButton, MenuItem, Slider, Stack, Switch, TextField } from '@mui/material';
import { ReportActor } from '../../../../../fflogs/reports';
import { LocationMatch } from '../../../../../fflogs/locator';
import { GroupBeeMarker } from './-GroupBeeMarker';
import { logToCanvasCoord, logToCanvasRotation } from '../-utils';
import dayjs from 'dayjs';
import { CircleConfig } from 'konva/lib/shapes/Circle';
import { Grayscale } from 'konva/lib/filters/Grayscale';


export const Route = createFileRoute('/analysis/aacm2s/bees/$reportID/$fightID')({
  component: GroupBees
})


type ActorLocation = {
  readonly actor: ReportActor;
  readonly location: LocationMatch | null;
}
/**
 * Type guarding predicate for filtering ActorLocations to only those that have
 * a known location.
 * 
 * Permits type-safe use for cases like
 * 
 *    actors.filter(onlyLocated).map(actor => actor.location.something)
 */
function onlyLocated(actorLocation: ActorLocation): actorLocation is ActorLocation & {location: LocationMatch} {
  return actorLocation.location !== null;
}

function GroupBees() {
  const {fightID} = Route.useParams();
  const fightIdx = parseInt(fightID, 10)-1;
  const {meta, events: allEvents, locators} = Route.parentRoute.useLoaderData();
  const [second, setSecond] = React.useState(false);
  const locator = locators[fightIdx];
  const events = second ? allEvents[fightIdx].secondWave : allEvents[fightIdx].firstWave;
  const tsOffset = Math.min(...events.map(c => c.timestamp));
  const tsMax = Math.max(...events.map(c => c.timestamp));
  const [bg] = useImage(bgPath)
  const [scale, setScale] = React.useState(0.6);
  
  const [selected, setSelected] = React.useState(null as number|null);
  
  const [currentTimestamp, setCurrentTimestamp] = React.useState(tsOffset);
  const formatTimestamp = React.useCallback((timestamp: number) => {
    return dayjs.duration(timestamp - meta.fights[fightIdx].startTime, "milliseconds").format("mm:ss.SSS");
  }, [fightIdx, meta]);
  const handleWheel = ({evt}: {evt: WheelEvent}) => {
    console.log("Wheeled by", evt.deltaY);
    // Full implementation should follow https://stackoverflow.com/questions/62969250/how-to-implement-zooming-with-a-mouse-wheel-like-its-done-in-a-typical-graphic
    setScale(scale * Math.exp(evt.deltaY * -0.001));
    evt.preventDefault();
  };
  const [beeGroup, setBeeGroup] = React.useState(-1);
  const allCasts = events.filter(event => event.type === "cast");
  const casts = (allCasts.length > 16 && second ? allCasts.slice(16) : allCasts.slice(0, 16)).slice(beeGroup === -1 ? 0 : beeGroup * 4, beeGroup === -1 ? 16 : beeGroup * 4 + 4);
  const [showWideLines, setWideLines] = React.useState(true);
  const [width, setWidth] = React.useState(500);
  const [height, setHeight] = React.useState(500);
  const [pos, setPos] = React.useState({x: 250, y:250});
  
  const containerRef = React.useRef(null as HTMLElement | null);
  React.useEffect(() => {
    const resize = () => {
      console.log("Resizing");
      if(containerRef.current !== null) {
        setWidth(containerRef.current.clientWidth);
        setHeight(containerRef.current.clientHeight);
        setPos({x: containerRef.current.clientWidth/2, y: containerRef.current.clientHeight / 2});
      }
    };
    window.addEventListener("resize", resize);
    resize();
    return () => { window.removeEventListener("resize", resize); };
  }, [containerRef]);
  const [players, bosses] = React.useMemo<[ActorLocation[], ActorLocation[]]>(() => {
    const players = meta.fights[fightIdx].friendlyPlayers.map(
      actorID => {
        const location = locator.estimateLocation(actorID, currentTimestamp, true);
        const actor = meta.actors[actorID];
        return {
          actor,
          location
        }
      }
    );
    const npcsData = meta.fights[fightIdx].enemyNPCs.map(npc => meta.actors.find(actor => actor.gameID == npc.gameID)).filter(npc => npc !== undefined);
    const bosses = npcsData.filter(npc => npc.subType == "Boss").map(actor => ({
      actor,
      location: locator.estimateLocation(actor.id, currentTimestamp, true)
    }));
    return [players, bosses];
  }, [fightIdx, currentTimestamp, meta, locator]);

  return <>
    <Stack direction="column" sx={{flexShrink: 0}}>
      Fight {fightID}
      <FormControlLabel 
        control={
          <Switch
            value={second && allEvents[fightIdx].secondWave.length > 0}
            onChange={() => {setSecond(!second)}}
          />
        }
        label="Second wave"
        disabled={allEvents[fightIdx].secondWave.length == 0}
      />
      <TextField
          select
          label="Bees"
          defaultValue={-1}
          helperText="Which group of bees to show"
          value={beeGroup}
          onChange={(e) => {setBeeGroup(parseInt(e.target.value, 10))}}
        >
          <MenuItem value={-1}>All</MenuItem>
          {Array.from({length: 4}, (_, i) => i).map(i => (
            <MenuItem key={i} value={i}>
              Bees {i*4+1} - {i*4+4}
            </MenuItem>
          ))}
        </TextField>
      <FormControlLabel control={<Checkbox checked={showWideLines} onChange={(e) => { setWideLines(e.target.checked); }} />} label="Show wide lines" />
      <List sx={{overflow: "auto"}} dense>
          {casts.map((cast, idx) => {
            const castAt = cast.timestamp;
            const beganAt = cast.timestamp - 7000;
            return (
              <React.Fragment key={idx}>
              <ListItemButton
                onMouseOver={() => {setSelected(idx)}}
                onMouseOut={() => {setSelected(null)}}
                onClick={() => {setCurrentTimestamp(beganAt)}}
                selected={selected == idx}
              >
                <ListItemAvatar>{formatTimestamp(beganAt)}:&nbsp;</ListItemAvatar>
                {meta.actors[cast.sourceID].name} {cast.sourceInstance} at [{cast.sourceResources.x/100}, {cast.sourceResources.y/100}] facing {logToCanvasRotation(cast.sourceResources.facing).toFixed(0)}
                &deg;
                
                
              </ListItemButton>
              <List dense disablePadding>
              <ListItemButton
                onClick={() => {setCurrentTimestamp(castAt)}}
                sx={{pl: 4}}
              >
                <ListItemAvatar>{formatTimestamp(castAt)}:&nbsp;</ListItemAvatar>
                Finishes casting
              </ListItemButton>
            </List>
            </React.Fragment>
            )
          }
          )}
        </List>
    </Stack>
    <Box sx={{py: 2, justifySelf: "stretch"}}>
      <Slider
          sx={{
            '& input[type="range"]': {
              WebkitAppearance: 'slider-vertical',
            },
          }}
          orientation="vertical"
          defaultValue={tsMax-tsOffset}
          value={tsMax - currentTimestamp}
          aria-label="Timestamp"
          track={false}
          valueLabelDisplay="auto"
          min={0}
          max={tsMax-tsOffset}
          valueLabelFormat={(v) => formatTimestamp(tsMax-v)}
          onKeyDown={preventHorizontalKeyboardNavigation}
          onChange={(_, value) => { setCurrentTimestamp(tsMax-(value as number)); }}
        />
    </Box>
    <Box ref={containerRef} sx={{flexGrow: 1, background: "black"}}>
      <Stage
        // offset={{x: 1000, y:563}}
        width={width}
        height={height}
        
        onDragEnd={(evt) => {if(evt.target === evt.currentTarget) setPos({x: evt.target.x(), y: evt.target.y()})}}
        x={pos.x}
        y={pos.y}
        scale={{x: scale, y: scale}}
        draggable={true}
        onWheel={handleWheel}
        >
          <Layer>
            <Image image={bg} x={-1000} y={-563}/>
          </Layer>
          <Layer>
            {casts.map((cast, idx) => 
              <GroupBeeMarker
                wideLine={showWideLines}
                key={idx+1}
                number={idx+1} 
                cast={cast} 
                selected={idx === selected}
                onClick={() => {setCurrentTimestamp(cast.timestamp - 7000)}}
                onMouseOver={() => {setSelected(idx)}}
                onMouseOut={() => {setSelected(null)}}
              />
            )}
          </Layer>
          <Layer>
            {players.filter(onlyLocated).map(player => <PlayerMarker key={player.actor.id} player={player as {location: LocationMatch, actor: ReportActor}}/>)}
          </Layer>
          <Layer>
            {bosses.filter(onlyLocated).map(boss => <BossMarker location={boss.location}  key={boss.actor.id} radius={50} strokeWidth={5} stroke="black"/>)}
          </Layer>
          <Layer draggable>
            <Circle
              x={0}
              y={0}
              radius={22.5*14}
              color="green"
              
              strokewidth={2}
              stroke="green"
            />
                        <Circle
              x={0}
              y={0}
              radius={2}
              color="red"
              
              strokewidth={2}
              stroke="red"
            />
          </Layer>
        </Stage>
      </Box>
  </>
}
function preventHorizontalKeyboardNavigation(event: React.KeyboardEvent) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
  }
}

function PlayerMarker({player}: {player: {location: LocationMatch, actor: ReportActor}}) {
  const [icon] = useImage(`${import.meta.env.BASE_URL}/icons/${player.actor.icon}.png`);
  return (
    <Group
      clipFunc={(ctx) => {ctx.arc(logToCanvasCoord(player.location.x), logToCanvasCoord(player.location.y), 32, 0, Math.PI * 2)}}
      filters={player.location.alive ? [] : [Grayscale]}
      opacity={0.8}
    >
      <Image
        image={icon}
        x={logToCanvasCoord(player.location.x) - (icon?.width ?? 0)/2}
        y={logToCanvasCoord(player.location.y) - (icon?.height ?? 0)/2}
      />
      <Circle
        x={logToCanvasCoord(player.location.x)}
        y={logToCanvasCoord(player.location.y)}
        radius={30}
        strokeWidth={6}
        stroke={player.location.alive ? "gold" : "gray"}
      />
    </Group>
  )
}

function BossMarker({location, ...rest}: {location: LocationMatch} & Omit<CircleConfig, "x"|"y">) {
  return <Group>
    <Circle
      x={logToCanvasCoord(location.x)}
      y={logToCanvasCoord(location.y)}
      {...rest}
    />      
  </Group>  
}