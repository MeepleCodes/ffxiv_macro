import React from "react";
import { FromWorker } from "./worker";
export type workerConstructor = {
  new (options?: { name?: string }): Worker
}

export type WorkerState<T> = Readonly<{
  state: "idle"
} | {
  state: "running",
  taskProgress: number,
  totalProgress: number,
  message?: string
} | {
  state: "done",
  result: T
  message?: string
}>;

export function useWorker<T>(ctor: workerConstructor) {
  const worker = React.useMemo(() => {
    
    const worker = new ctor();
    console.log("Creating new worker", worker);
    return worker;
  }, [ctor]);
  const [state, setState] = React.useState<WorkerState<T>>({
    state: "idle"
  });
  React.useEffect(() => {
    const w = worker;
    const handleMessage = (ev: MessageEvent<FromWorker<T>>) => {
      switch(ev.data.type) {
        case "progress": {
          const {taskProgress, totalProgress, message} = ev.data;
          setState({
            state: "running",
            taskProgress, totalProgress, message
          });
          break;
        }
        case "complete": {
          const {result, message} = ev.data;
          setState({
            state: "done",
            result, message
          });
          break;
        }
      }
    };
    w.addEventListener("message", handleMessage);
    // return () => {
    //   console.log("Terminating worker");
    //   w.removeEventListener("message", handleMessage);
    //   w.terminate();
    // }
  }, [worker]);
  const postMessage = React.useCallback((message: unknown) => {
    console.log("Posting message to worker");
    worker.postMessage(message);
    // worker.postMessage("hi")
  }, [worker]);
  console.log("Returning worker", worker, "from hook");
  return {
    state,
    worker,
    postMessage
  };
}