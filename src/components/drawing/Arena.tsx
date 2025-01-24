import { Image, KonvaNodeEvents, Layer, Stage, StageProps } from 'react-konva';
import React from 'react';
import { Box } from '@mui/material';
import useImage from 'use-image';
import { Zone, Zones } from './zones';
import Konva from 'konva';

export type ArenaProps = React.PropsWithChildren<{
  zone: Zone
}> & StageProps & KonvaNodeEvents;


const Arena = React.forwardRef(function Arena(props: ArenaProps, ref: React.ForwardedRef<Konva.Stage>) {
  const {zone: zoneOrName, ...rest} = props;
  const containerRef = React.useRef(null as HTMLElement | null);
  const [scale, setScale] = React.useState(0.6);
  const [width, setWidth] = React.useState(500);
  const [height, setHeight] = React.useState(500);
  const [pos, setPos] = React.useState({x: 250, y:250});
  const {image, scale: backgroundImageScale = 1.0} = typeof(zoneOrName) === "string" ? Zones[zoneOrName] : zoneOrName;
  const [bg] = useImage(image);
  // const [currentTimestamp, setCurrentTimestamp] = React.useState(tsOffset);
  // const formatTimestamp = React.useCallback((timestamp: number) => {
  //   return dayjs.duration(timestamp - meta.fights[fightIdx].startTime, "milliseconds").format("mm:ss.SSS");
  // }, [fightIdx, meta]);
  const handleWheel = ({evt}: {evt: WheelEvent}) => {
    // console.log("Wheeled by", evt.deltaY);
    // Full implementation should follow https://stackoverflow.com/questions/62969250/how-to-implement-zooming-with-a-mouse-wheel-like-its-done-in-a-typical-graphic
    setScale(scale * Math.exp(evt.deltaY * -0.001));
    evt.preventDefault();
  };
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
  return (
    <Box ref={containerRef} sx={{flexGrow: 1, alignSelf: "stretch"}}>
    <Stage
      // offset={{x: 1000, y:563}}
      width={width}
      height={height}
      
      ref={ref}
      onDragEnd={(evt) => {if(evt.target === evt.currentTarget) setPos({x: evt.target.x(), y: evt.target.y()})}}
      x={pos.x}
      y={pos.y}
      scale={{x: scale, y: scale}}
      draggable={true}
      onWheel={handleWheel}
      {...rest}
      >
        
        {bg && <Layer listening={false} >
          <Image image={bg} x={-(bg.width * backgroundImageScale)/2} y={-(bg.height * backgroundImageScale)/2} scale={{x:backgroundImageScale, y:backgroundImageScale}}/>
        </Layer>
        }
        {props.children}

        {/* <Layer>
          {players.filter(onlyLocated).map(player => <PlayerMarker key={player.actor.id} player={player as {location: LocationMatch, actor: ReportActor}}/>)}
        </Layer>
        <Layer>
          {bosses.filter(onlyLocated).map(boss => <BossMarker location={boss.location}  key={boss.actor.id} radius={50} strokeWidth={5} stroke="black"/>)}
        </Layer>
        <Layer draggable>
          <Circle
            x={0}
            y={0}
            radius={22.5*6}
            color="red"
            
            strokewidth={2}
            stroke="red"
          />
                      <Circle
            x={0}
            y={0}
            radius={2}
            color="red"
            
            strokewidth={2}
            stroke="red"
          /> */}
        {/* </Layer> */}
      </Stage>
    </Box>
  )
});
export default Arena;