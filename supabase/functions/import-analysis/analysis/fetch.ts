import { Action } from "../excel/Action";
import { LocationSaveData, Locator } from "./locator";
import { Report, ReportIndex } from "../fflogs/types";
import { Event } from "../fflogs/types";
import { Encounter, FightData, ReportActions } from "./types";

export async function fetchMeta(reportID: string): Promise<Report> {
  return fetch(`${import.meta.env.BASE_URL}/analysis-data/${reportID}/meta.json`).then(resp => resp.json()) as Promise<Report>;
}
export async function fetchIndex(): Promise<ReportIndex[]> {
  return fetch(`${import.meta.env.BASE_URL}/analysis-data/reports.json`).then(resp => resp.json()) as Promise<ReportIndex[]>;
}
export async function fetchFightData(reportID: string, fightID: string): Promise<FightData> {
  return Promise.all(["events.json", "locations.json", "actions.json"].map(file =>
    fetch(`${import.meta.env.BASE_URL}/analysis-data/${reportID}/${fightID}/${file}`).then(resp => resp.json())
  )).then(([events, locations, actions]) => ({
    events: events as Event[],
    locator: Locator.fromSaveData(locations as LocationSaveData),
    actions: (actions as unknown[]).filter(action => action !== null) as Action[]
  }));
}
export async function fetchActions(reportID: string, fightID: string): Promise<Action[]> {
  return fetch(
    `${import.meta.env.BASE_URL}/analysis-data/${reportID}/${fightID}/actions.json`
  ).then(
    resp => resp.json()
  ).then(
    (actions: (Action | null)[]) => actions.filter(a => a !== null)
  );
}

export async function fetchReportActionSummary(reportID: string): Promise<ReportActions> {
  console.time("fetchReportActionSummary");
  const meta = await fetchMeta(reportID);
  const fightActions = await Promise.all(
    meta.fights.map(fight =>
      fetchActions(reportID, `${fight.id}`)
    )
  );
  console.timeLog("fetchReportActionSummary", "fetched meta");
  const encounters: Record<number, Encounter> = {};
  meta.fights.forEach((fight, i) => {
    const encounterID = fight.encounterID;
    if (!Object.hasOwn(encounters, encounterID)) {
      encounters[encounterID] = { name: fight.name, actions: [] };
    }
    const enc = encounters[encounterID];
    for (const action of fightActions[i]) {
      if (!enc.actions.some(testA => action["#"] === testA["#"])) {
        enc.actions.push(action);
      }
    }
  });
  console.timeLog("fetchReportActionSummary", "collected encounters");
  const asArr = Object.values(encounters);
  asArr.forEach(enc => enc.actions.sort((a, b) => a["#"] - b["#"]));
  console.timeEnd("fetchReportActionSummary");
  return {
    encounters: asArr
  }
}