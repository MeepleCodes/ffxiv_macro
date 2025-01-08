import { client, importOrFetch } from "./client";
import { EventBase, LocationSaveData, Locator } from "../analysis/locator";
import { Event } from "./types";
import { logToGame, logToGameCoord, logToGameRotation } from "../components/analysis/position";

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
        data: Event[],
        nextPageTimestamp: number | null
      }
    }
  }
}
async function getAllEvents(query: string, vars: locationsFetchVars) {
  const allEvents: EventBase[] = [];
  function nextPage(page: RawEvents): Promise<RawEvents> | null  {
    if((page.reportData.report.events.nextPageTimestamp ?? 0) === 0) {
      return null;
    }
    return client.request<RawEvents>(
      query,
      {
        ...vars,
        startTime: page.reportData.report.events.nextPageTimestamp
      }
    );
  }
  for(let page: RawEvents|null = await client.request(query, vars); page != null; page = await nextPage(page)) {
    allEvents.push(
      ...page.reportData.report.events.data
    )
  }
  return allEvents;
}
function locatorFromEvents(events: Event[]): Locator {
  const locator = new Locator();
  events.forEach(event => {
      if(event.sourceID !== undefined && event.sourceResources !== undefined) {
        locator.addKnownLocation(
          event.sourceID,
          event.sourceInstance ?? 0,
          event.timestamp,
          logToGameCoord(event.sourceResources.x),
          logToGameCoord(event.sourceResources.y),
          logToGameRotation(event.sourceResources.facing),
          event.sourceResources.hitPoints > 0
        );
      }
      if(event.targetID !== undefined && event.targetResources !== undefined) {
        locator.addKnownLocation(
          event.targetID,
          event.targetInstance ?? 0,
          event.timestamp,
          logToGameCoord(event.targetResources.x),
          logToGameCoord(event.targetResources.y),
          logToGameRotation(event.targetResources.facing),
          event.targetResources.hitPoints > 0
        );
      }

  });
  locator.trimLocations(100);
  return locator;
}  

export type locationsFetchVars = {reportID: string, startTime: number, endTime: number}
export async function importOrFetchLocations(path: string, vars: locationsFetchVars | locationsFetchVars[], force = false) {
  return importOrFetch<LocationSaveData | LocationSaveData[]>(
    path,
    query,
    vars,
    {
      fetch: getAllEvents,
      postProcess: (events) => locatorFromEvents(events as Event[]).toSaveData(),
      force
    }
  );
}