import React from "react";
import { Zone } from "../drawing/zones"
import { CastAnimation, castTimeline, MarkerPart, Timeline, timelineAt } from "./animations";
import { Box, Button, Card, CardActionArea, CardContent, CardProps, Paper, PaperProps, Slider } from "@mui/material";
import Arena from "../drawing/Arena";
import PlanPart from "./PlanPart";
import { Layer } from "react-konva";
import { mergeSx } from "../../utils";
export type AnimatedPlanConfig = {
  zone: Zone,
  frames: number,
  parts: (Timeline|CastAnimation)[]
}

export type AnimatedPlanProps = {
  config: AnimatedPlanConfig,
  onShowFrame?: (frame: number, parts: MarkerPart[]) => void
} & PaperProps;


export default function AnimatedPlan(props: AnimatedPlanProps) {
  const {config, sx, onShowFrame, ...rest} = props;
  const timelines = React.useMemo(() => {
    const timelines = config.parts.map(part => part.type === "timeline" ? part : castTimeline(part))
    console.log("Parsed config to timelines", timelines);
    return timelines;
  }, [config.parts]);
  const frames = React.useMemo(() => {
    return [
      ...new Set(
        timelines.flatMap(
          timeline => timeline.keyframes.map(
            keyframe => keyframe.frame
          )
        )
      ).values()
    ].toSorted();
  }, [timelines]);
  const [frame, setFrame] = React.useState(0);
  const partsNow = React.useMemo(() => {
    const parts = timelines.map(timeline => timelineAt(timeline, frame));
    onShowFrame?.(frame, parts);
    return parts;
  }, [timelines, frame, onShowFrame]);
  const [playRate, setPlayRate] = React.useState(0);
  React.useEffect(() => {
    const id = playRate > 0 ? window.setInterval(() => {
      setFrame(frame => (frame + 1) % config.frames)
    }, 1000/playRate) : 0;
    return () => {
      if(id > 0) clearInterval(id);
    }
  }, [playRate, setFrame, config]);

  return (<>
    <Paper
      {...rest}
      sx={mergeSx(sx, {
        display: "flex",
        flexDirection: "column"
      })}
    >
      <Arena zone={config.zone}>
        <Layer>
          {partsNow.map(part =>
            <PlanPart key={part.id} config={part}/>
          )}
        </Layer>
      </Arena>
      <Box
        sx={{
          flex: 0,
          px: 2,
          display: "flex",
          flexDirection: "row"
        }}
      >
        <Button onClick={() => {setPlayRate(rate => rate > 0 ? 0 : 1000)}}>
          {playRate > 0 ? "Pause" : "Play"}
        </Button>
        <Slider
          min={0}
          max={props.config.frames}
          defaultValue={0}
          value={frame}
          marks={frames.map(frame => ({value: frame}))}
          onChange={(_, newValue) => {setFrame(newValue as number)}}
        />
      </Box>
    </Paper>
  </>)
}