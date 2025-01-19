import { makeFetchAllQuery, importOrFetch } from "./backend";
import { client } from './client';
import { Page } from './client';
import { fetchAll } from './client';
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
function getPage(response: RawEvents): Page<Event> {
  return {
    data: response.reportData.report.events.data,
    nextPageTimestamp: response.reportData.report.events.nextPageTimestamp ?? undefined
  };
}
export type EventFetchVars = {reportID: string, startTime: number, endTime: number}
export async function fetchAllEvents(vars: EventFetchVars) {
  return await fetchAll(
    query,
    vars,
    getPage
  );
}