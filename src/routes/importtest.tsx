import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import AnalysisWorker from "../workers/Analysis.Worker?worker"
import { Button, LinearProgress, Link, List, ListItem, ListItemText, Paper, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from '@tanstack/react-router';
import { fetchFightData } from '../analysis/fetch';
import { useWorker } from '../workers/useWorker';
import { AnalysisResult } from '../workers/Analysis';


export const Route = createFileRoute('/importtest')({
  component: AnalysisTest,
  loader: async () => {
    const fight = await fetchFightData("KV1MBZ4Af8PCb9qD", "16");
    return {
      fight
    }
  }
})

function AnalysisTest() {
  const {fight} = Route.useLoaderData();
  const {state, postMessage} = useWorker<AnalysisResult>(AnalysisWorker);
  return <Paper>
    <Button onClick={() => {postMessage(fight.events)}}>Import</Button>
    {state.state == "running" && <>
      <Typography variant="body1">{state.message ?? ""}</Typography>
      <LinearProgress variant="determinate" value={state.totalProgress}/>
    </>}
    {state.state == "done" && <>
      <Typography variant="body1">{state.message ?? ""}</Typography>
      <List sx={{overflow: "auto"}}>
        {state.result.actions.map((r, i) => 
        <ListItem key={i}>
          <ListItemText primary={r.Name} secondary={r['#']}/>
        </ListItem>
        )}
      </List>

    </>}
      
  </Paper>
}
