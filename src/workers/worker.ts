export type FromWorker<T> = {
  type: "progress",
  taskProgress: number,
  totalProgress: number,
  message?: string
} | {
  type: "complete",
  result: T,
  message?: string
};
