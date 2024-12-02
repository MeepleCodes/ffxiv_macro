import { client, importOrFetch } from "./client";
import { EventBase, LocationSaveData, Locator } from "./locator";

const query = `
query ReportData($reportID: String!, $startTime: Float!, $endTime: Float!) {
    reportData {
        report(code: $reportID) {
            events(
              limit: 10000
              startTime: $startTime
              endTime: $endTime
              includeResources: true
            ) {
              data
              nextPageTimestamp
            }
        }
    }
}`;

type RawEvents = {
  reportData: {
    report: {
      events: {
        data: EventBase[],
        nextPageTimestamp: number | null
      }
    }
  }
}


export type locationsFetchVars = {reportID: string, startTime: number, endTime: number}
export async function importOrFetchLocations(path: string, vars: locationsFetchVars | locationsFetchVars[], force = false) {
  
  async function getAllEvents(query: string, vars: locationsFetchVars) {
    const allEvents: EventBase[] = [];
    function nextPage(page: RawEvents): Promise<RawEvents> | null  {
      if((page.reportData.report.events.nextPageTimestamp ?? 0) === 0) return null;
      return client.request<RawEvents>(query, {...vars, startTime: page.reportData.report.events.nextPageTimestamp});
    }
    for(let page: RawEvents|null = await client.request(query, vars); page != null; page = await nextPage(page)) {
      allEvents.push(
        ...page.reportData.report.events.data
        // .map(
        //   // Copy out only the fields we want
        //   // FIXME: *Resources needs to reduce down too
        //   ({timestamp, sourceID, sourceResources, targetID, targetResources}) => 
        //   ({timestamp, sourceID, sourceResources: stripRes(sourceResources), targetID, targetResources: stripRes(targetResources)})
        // )
      )
    }
    return {
      events: allEvents
    }
  }
  return importOrFetch<LocationSaveData | LocationSaveData[]>(
    path,
    query,
    vars,
    {
      fetch: getAllEvents,
      postProcess: ({events}) => Locator.fromEvents(events as EventBase[]).getJsonData(),
      force
    }
  );
}