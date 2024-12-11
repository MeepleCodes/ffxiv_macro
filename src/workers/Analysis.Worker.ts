import XIVAPI from '@xivapi/js';
import { FromWorker } from './worker';
import { Action } from '../excel/Action';
import { AnalysisResult } from './Analysis';
const xiv = new XIVAPI({});
type XIVError = {
  Error: true,
  Subject: string,
  Message: string,
  ExCode: number
  // "Hash": "bdddd3ece9aba6efa46542cc88c5a1f7b89e94a2",
  // "Ex": "Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException",
  // "ExCode": 404,
  // "Url": "",
  // "Debug": {
  //     "ID": "ekwhfDdV24120404",
  //     "File": "#53 xivapi.com/src/Service/Content/GameData.php",
  //     "Method": "GET",
  //     "Path": "/Action/39554123123",
  //     "Action": "App\\Controller\\XivGameContentController::contentData",
  //     "Code": 404,
  //     "Date": "2024-12-04 16:45:39",
  //     "Env": "prod"
  // }
};
type XIVAction = Omit<Action, "#"> & { ID: number, Error?: undefined }

self.onmessage = async (e: MessageEvent<string>) => {
  const actionIDs = [...new Set(e.data.map(event => event.abilityGameID))];
  const results: Action[] = [];
  console.log("Starting to fetch", actionIDs.length, "actions");
  for(let i=0; i<actionIDs.length; i++) {
    const progress = (i * 100)/actionIDs.length;
    self.postMessage({
      type: "progress",
      totalProgress: progress,
      taskProgress: progress,
      message: `Fetching action ${actionIDs[i]}`
    } as FromWorker<AnalysisResult>);
    const xivAction = await xiv.data.get("Action", actionIDs[i]) as XIVAction | XIVError;
    if(xivAction.Error === true) {
      if(xivAction.ExCode === 404) {
        console.log("Action", actionIDs[i], "not found in XIVAPI");
      } else {
        console.log("Unknown response from XIVAPI", xivAction);
      }
    } else {
      console.log("Fetched action", xivAction);
      const {ID, ...rest} = xivAction;
      results.push({
        ["#"]: ID,
        ...rest
      });
    }

  }
  self.postMessage({
    type: "complete",
    result: {
      actions: results
    },
    message: `Fetched ${e.data.length} actions`
  } as FromWorker<AnalysisResult>);
}
