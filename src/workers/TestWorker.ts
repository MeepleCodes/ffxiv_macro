console.log("Test worker starting");
self.name="TestWorker";
self.onmessageerror = (e: MessageEvent) => {
  console.error("Message error", e);
}
self.onmessage = (e: MessageEvent<string>) => {
  console.log("Got message", e.data);
  self.postMessage(`Hello ${e.data}`);
}
self.postMessage("Starting");
console.log(self);