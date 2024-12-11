import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { AnyPart, PartSchema } from '../components/plans/schemas'
import { Layer } from 'react-konva';
import PlanPart from '../components/plans/PlanPart';
import Arena from '../components/analysis/Arena';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { Box } from '@mui/system';

export const Route = createFileRoute('/plantest')({
  component: PlanTest
})

const animationData = {
  zone: "aacm3s",
  frames: 100,
  parts: [
    {
      part: {
        id: "one",
        type: "cast",
        castTime: 5,
        fadeTime: 10,
        marker: {
          type: "aoecone",
          location: {
            x: 100,
            y: 100
          },
          facing: 180,
          range: 40
        }
      }
    }
  ]
}

const testData: AnyPart[] = [
  
  {id: "group",
    type: "group",
    elements: [
      {id: "one", type: "aoecircle", location: {x: 100, y: 100}, radius: 10},
      {id: "two", type: "aoecone", location: {x: 100, y: 100}, angle: 60, facing: 0, range: 10},
    ]
  }
] as const;

function PlanTest() {
  const [config, setConfig] = React.useState<AnyPart[]>([...testData]);
  const [textConfig, setTextConfig] = React.useState(JSON.stringify(config, null, 2));
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
  return <>
    <Arena>
      <Layer>
        {config.map(part => <PlanPart key={part.id} config={part} onChange={handleChange}/>)}
      </Layer>
    </Arena>
    <Paper sx={{position: "absolute", right: "8px", top: "8px", bottom: "8px", width: "300px", display: "flex", flexDirection: "column", alignItems: "stretch"}}>
      <Typography sx={{flex: 1, whiteSpace: "pre-wrap"}} variant='caption'>
        {JSON.stringify(config, null, 2)}
      </Typography>
      <Stack direction="row">
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
      <textarea style={{flex: 1}} value={textConfig} onChange={(e) => {setTextConfig(e.target.value)}}/>
    </Paper>
  </>
}