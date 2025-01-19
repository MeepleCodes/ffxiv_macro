import { createFileRoute } from '@tanstack/react-router'
import { useWorker } from '../../workers/useWorker';
import AnalysisWorker from "../../workers/Analysis.Worker?worker"
import { Button, LinearProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import React from 'react';
import supabase from '../../supabase/client';
import { AnalysisMessage } from '../../workers/Analysis';

export const Route = createFileRoute('/analysis/import/worker')({
  component: AnalysisImport
})

function AnalysisImport() {
  const [code, setCode] = React.useState("");
  const {state, postMessage} = useWorker<AnalysisMessage, number>(AnalysisWorker);
  const startImport = React.useCallback(() => {
    void supabase.auth.getSession().then(({data} )=> {
        postMessage({
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          reportCode: code
        })
      }
    )
  }, [code, postMessage]);
  return <Paper>
    <Stack direction="row">
      <TextField onChange={(e) => {setCode(e.target.value)}} value={code} label="FFLogs report code"/>
      <Button onClick={startImport} disabled={code === "" || state.state === "running"}>Import</Button>
    </Stack>
    {state.state == "running" && <>
      <Typography variant="body1">{state.message ?? ""}</Typography>
      <LinearProgress variant="determinate" value={state.totalProgress}/>
    </>}
    {state.state == "done" && <>
      <Typography variant="body1">{state.message ?? ""}</Typography>
      Report complete, new ID is {state.result}
    </>}
    {state.state === "error" && <>
      <Typography variant="h6">Error</Typography>
      <Typography variant="body1">{state.message ?? ""}</Typography>
    </>}
  </Paper>  
}