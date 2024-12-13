import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { AnyPart, Part, PartSchema } from '../components/plans/schemas'

import { Button, Divider, Paper, Stack, Typography } from '@mui/material';
import { Box } from '@mui/system';
import AnimatedPlan, { AnimatedPlanConfig } from '../components/plans/AnimatedPlan';
import { CastAnimation, MarkerPart } from '../components/plans/animations';

export const Route = createFileRoute('/plantest')({
  component: PlanTest
})
// Start time is 8:43

// First cone at 8:47, then every second
function makeCone(i: number): CastAnimation<Part<"aoecone">> {
  return {
    type: "cast",
    frame: 20 + (10 * i),
    castTime: 5,
    fadeTime: 10,
    marker: {
      id: `aoecone-cast-${i}`,
      type: "aoecone",
      location: {
        x: 100,
        y: 100
      },
      facing: 180 + 45 * i,
      range: 40,
      angle: 60
    }
  }
};
// First sequence cast at 8:47, 51, 55
// Second sequence cast at 8:54, 58, 02
function makeExplosion(start: number, stage: number, x: number, y: number): CastAnimation {
  return {
    type: "cast",
    frame: start + (stage + 1) * 40,
    castTime: 40,
    fadeTime: 10,
    marker: rainMarker(`rain-${start}-${stage}-${x}-${y}`, stage, x, y)
  }
}
function rainMarker(id: string, stage: number, x: number, y: number): Omit<Part<"aoecircle">, "colour"|"opacity">|Omit<Part<"aoedonut">, "colour"|"opacity"> {
  switch(stage) {
    case 0: return {
      id,
      type: "aoecircle",
      location: {x, y},
      radius: 8
    }
    case 1: return {
      id,
      type: "aoedonut",
      location: {x, y},
      innerRadius: 8,
      outerRadius: 16
    }
    default: return {
      id,
      type: "aoedonut",
      location: {x, y},
      innerRadius: 16,
      outerRadius: 24
    }
  }
}
// Explosions at 8:58 and 9:03
function makePlayerExplosion(frame: number, x: number, y: number): CastAnimation<Part<"aoecircle">> {
  return {
    frame,
    castTime: 0,
    fadeTime: 10,
    type: "cast",
    marker: {
      id: `player-explosion-${x}-${y}-${frame}`,
      type: "aoecircle",
      location: {x, y},
      radius: 8
    }

  }
}
const playerCoords = [
  {x: 93, y: 100},
  {x: 107, y: 100},
  {x: 100, y: 93},
  {x: 100, y: 107},
  {x: 86, y: 86},
  {x: 86, y: 114},
  {x: 114, y: 86},
  {x: 114, y: 114},
]

const animationData: AnimatedPlanConfig = {
  zone: "aacm3",
  frames: 220,
  parts: [
    ...new Array(8).fill(undefined).map((_, i) => makeCone(i)),
    ...new Array(3).fill(undefined).map((_, i) => makeExplosion(0, i, 93, 107)),
    ...new Array(3).fill(undefined).map((_, i) => makeExplosion(0, i, 107, 93)),
    ...new Array(3).fill(undefined).map((_, i) => makeExplosion(70, i, 93, 93)),
    ...new Array(3).fill(undefined).map((_, i) => makeExplosion(70, i, 107, 107)),
    ...playerCoords.map(({x, y}) => makePlayerExplosion(150, x, y)),
    ...playerCoords.map(({x, y}) => makePlayerExplosion(200, x, y)),
  ]
};

const testData: AnyPart[] = [
  
  {id: "group",
    type: "group",
    elements: [
      {id: "one", type: "aoecircle", location: {x: 100, y: 100}, radius: 10, colour: {r: 255, g: 0, b: 0}, opacity: 1},
      {id: "two", type: "aoecone", location: {x: 100, y: 100}, angle: 60, facing: 0, range: 10, colour: {r: 255, g: 0, b: 0}, opacity: 1},
    ]
  }
] as const;

function PlanTest() {
  const [config, setConfig] = React.useState<AnyPart[]>([...testData]);
  const [textConfig, setTextConfig] = React.useState(JSON.stringify(config, null, 2));
  const [frameConfig, setFrameConfig] = React.useState("");
  const [frame, setFrame] = React.useState(0);
  const handleChange = (newPart: AnyPart) => {
    console.log("Test handleChange", newPart);
    setConfig((parts) => {
      const idx = parts.findIndex(p => p.id === newPart.id);
      if(idx === -1) {
        return [...parts, newPart];
      } else {
        return parts.toSpliced(idx, 1, newPart);
      }
    })
  }
  const handleFrame = (frame: number, parts: MarkerPart[]) => {
    setFrame(frame);
    setFrameConfig(JSON.stringify(parts, null, 2));
  }
  return <>
  <Stack
    direction="row"
    alignItems="stretch"
    spacing={1}
    sx={{
      width: "100%",
      height: "100%",
      p:1
    }}
  >
    {/* <Arena>
      <Layer>
        {config.map(part => <PlanPart key={part.id} config={part} onChange={handleChange}/>)}
      </Layer>
    </Arena> */}
    <AnimatedPlan config={animationData} onShowFrame={handleFrame} sx={{flex: 1}}/>
    <Paper
      sx={{
        width: "300px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch"
      }}
    >
      <textarea readOnly style={{flex: 1}} value={JSON.stringify(animationData, null, 2)}/>
      {/* <Stack direction="row" flex={0}>
        <Button onClick={() => {
          try {
            setConfig(PartSchema.array().parse(JSON.parse(textConfig)));
          } catch(e: unknown) {
            console.error("Failed to parse", e);
          }
        }}
        >Parse /\</Button>
        <Button onClick={() => {
          setTextConfig(JSON.stringify(config))
        }}>\/ Refresh</Button>
      </Stack>
      <textarea style={{flex: 1}} value={textConfig} onChange={(e) => {setTextConfig(e.target.value)}}/> */}
      <Divider />
      <Box>
        Frame: {frame}
      </Box>
      <textarea readOnly style={{flex: 1}} value={frameConfig}/>
    </Paper>
    </Stack>
  </>
}