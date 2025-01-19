export type FromWorker<T> = {
  type: "progress",
  taskProgress: number,
  totalProgress: number,
  message?: string
} | {
  type: "complete",
  result: T,
  message?: string
} | {
  type: "error",
  message?: string
};

export function postWorkerMessage<T>(message: FromWorker<T>) {
  self.postMessage(message);
}