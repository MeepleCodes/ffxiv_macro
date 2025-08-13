import { Image, Layer, Stage } from 'react-konva';
import React from 'react';
import { Box } from '@mui/material';
import useImage from 'use-image';
import { Image as KonvaImage } from 'konva/lib/shapes/Image';
import Konva from 'konva';

export type ReplayProps = React.PropsWithChildren<{
  backgroundImageUrl?: string;
  backgroundImageScale?: number;
  filterBackground?: boolean;
}>;


const FilterMap = function(this: Konva.Node, imageData: ImageData) {

  
  // Centre is 1024,1024, want +/- 80px around that
  // 70px from centre: Arena.tsx:30 Pixel value range (3) [205, 193, 143] (3) [225, 212, 166]
  // 75px: [204, 193, 142] (3) [227, 216, 166]
  // 78px:  (3) [204, 193, 141] (3) [228, 216, 169]

  // const target = [216, 202, 153];
  // const range = 10;
  const pixRange = [[204, 228], [193, 216], [141, 169]];
  const maskData = new ImageData(imageData.width, imageData.height);
  // const mask = new ImageData(imageData.width, imageData.height);
  for(let i=0; i<imageData.data.length; i+= 4) {
    // const dist = Math.sqrt(target.map((val, idx) => Math.pow(imageData.data[i + idx] - val, 2)).reduce((a, b) => a + b));
    // if(dist < range) maskData.data[i + 3] = 255;
    
    if(pixRange.every(([min, max], idx) => imageData.data[i+idx] >= min && imageData.data[i+idx] <= max)) maskData.data[i+3] = 255;
    else if(pixRange.every((_, idx) => imageData.data[i+idx] == 0)) maskData.data[i+3] = 0;
    else maskData.data[i+3] = 127;
  }
  Konva.Filters.Blur.call(this, maskData);

  for(let i=0; i<imageData.data.length; i+= 4) {
    imageData.data[i+3] = maskData.data[i+3];
  }
}


export default function Arena(props: ReplayProps) {
  
  const containerRef = React.useRef(null as HTMLElement | null);
  const [scale, setScale] = React.useState(0.6);
  const [width, setWidth] = React.useState(500);
  const [height, setHeight] = React.useState(500);
  const [pos, setPos] = React.useState({x: 250, y:250});
  const [bg] = useImage(props.backgroundImageUrl ?? "", "anonymous");
  React.useEffect(() => {
    if(bg) bgRef.current?.cache();
  }, [bg]);
  const bgRef = React.useRef<KonvaImage>(null);
  const {backgroundImageScale = 1.0, filterBackground = false} = props;
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
      
      onDragEnd={(evt) => {if(evt.target === evt.currentTarget) setPos({x: evt.target.x(), y: evt.target.y()})}}
      x={pos.x}
      y={pos.y}
      scale={{x: scale, y: scale}}
      draggable={true}
      onWheel={handleWheel}
      >
        
        {bg && <Layer>
          <Image
            image={bg}
            x={-(bg.width * backgroundImageScale)/2}
            y={-(bg.height * backgroundImageScale)/2}
            scale={{x:backgroundImageScale, y:backgroundImageScale}}
            ref={bgRef}
            blurRadius={10}
            filters={filterBackground ? [FilterMap] : []}
          />
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
}