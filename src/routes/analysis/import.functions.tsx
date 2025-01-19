import { createFileRoute } from '@tanstack/react-router'
import React from 'react';
import supabase from '../../supabase/client';
import { Button,  Paper, Stack, TextField, Typography } from '@mui/material';

export const Route = createFileRoute('/analysis/import/functions')({
  component: AnalysisImport
})

type State = Readonly<{
  state: "idle"
} | {
  state: "running",
} | {
  state: "done",
  result: {
    reportID: number
  }
} | {
  state: "error",
  message?: string,
}>;


function AnalysisImport() {
  const [code, setCode] = React.useState("");
  const [state, setState] = React.useState<State>({state: "idle"});
  const startImport = React.useCallback(() => {
    setState({state: "running"});
    supabase.functions.invoke("import-analysis", {
      body: {
        reportCode: code,
        api: import.meta.env.VITE_FFLOGS_V1_API,
        key: import.meta.env.VITE_FFLOGS_V1_KEY,
      }
    }).then(resp => {
      if(resp.error !== null) {
        setState({state: "error", message: String(resp.error)});
      } else {
        setState({state: "done", result: resp.data});
      }
    }).catch((e: unknown) => {
      setState({state: "error", message: String(e)});
    });
  }, [code, setState]);
  return <Paper>
    <Stack direction="row">
      <TextField onChange={(e) => {setCode(e.target.value)}} value={code} label="FFLogs report code"/>
      <Button onClick={startImport} disabled={code === "" || state.state === "running"}>Import</Button>
    </Stack>
    {state.state == "running" && <>
      <Typography variant="body1">In progress</Typography>
    </>}
    {state.state == "done" && <>
      <Typography variant="body1">Complete</Typography>
      Report complete, new ID is {state.result}
    </>}
    {state.state === "error" && <>
      <Typography variant="h6">Error</Typography>
      <Typography variant="body1">{state.message ?? ""}</Typography>
    </>}
  </Paper>
}