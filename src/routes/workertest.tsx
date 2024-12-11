import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import TestWorker from "../workers/TestWorker?worker"
import { Button, Paper } from '@mui/material';


export const Route = createFileRoute('/workertest')({
  component: WorkerTest,
})

function WorkerTest() {
  const worker = React.useMemo(() => {
    console.log("Creating worker");
    // const worker = new TestWorker();
    const worker = new Worker(URL.createObjectURL(new Blob([`
      console.log("Blob worker starting");
      onmessage = function(e) {
        console.log("Received message", e);
        postMessage("Hello " + e.data);
      }
      `], {type: "application/javascript"})));
    console.log("Created worker", worker);
    return worker;
  }, []);
  const [resp, setResp] = React.useState<string|null>(null);
  React.useEffect(() => {
    console.log("Applying handlers");
    worker.onmessage = (ev: MessageEvent<string>) => {
      console.log("Response from worker:", ev.data);
      setResp(ev.data);
    }
    
    worker.onerror = (ev: ErrorEvent) => {
      console.error("Worker error:", ev);
    }
    worker.onmessageerror = (ev: MessageEvent) => {
      console.log("Message error:", ev);
    }
    worker.postMessage("Startup");
    // return () => {
    //   console.log("Terminating worker");
    //   worker.terminate();
    // }
  }, [worker]);
  return <Paper>
    <Button onClick={() => {worker.postMessage("world")}}>Post</Button>
    {resp === null ? "No response" : `Response: ${resp}`}
  </Paper>
}