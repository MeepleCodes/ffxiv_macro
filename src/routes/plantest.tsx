import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { Part } from '../components/plans/schemas'
import { animationData } from './-plantest.data';

import { Divider, Paper, Stack } from '@mui/material';
import { Box } from '@mui/system';
import AnimatedPlan from '../components/plans/AnimatedPlan';

export const Route = createFileRoute('/plantest')({
  component: PlanTest
})


function PlanTest() {
  const [frameConfig, setFrameConfig] = React.useState("");
  const [frame, setFrame] = React.useState(0);
  const handleFrame = (frame: number, parts: Part[]) => {
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