/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import path from "path";
import { parse } from "csv-parse/sync";
import { fetchAllPages, importOrFetch, Page } from "../src/fflogs/client";
import { importOrFetchMeta, Report } from "../src/fflogs/reports";
import { CastEvent, Event } from "../src/fflogs/types";
import { existsSync, mkdirSync, promises, readFile, readFileSync, writeFileSync } from "fs";
import { getRateLimitData } from "../src/fflogs/ratelimits";
import { Locator } from "../src/fflogs/locator";
import { Action, ActionCast, parseActionsCSV } from "../src/excel/Action";
import { importOrFetchLocations } from "../src/fflogs/locations";
import { writeFile } from "fs/promises";
import { ArgumentParser } from "argparse";
import { exit } from "process";

/**
 * Query for fetching everything that happened during a fight.
 *
 * We filter this client-side to only save the events we care about
 */
const eventsQuery = `
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
/**
 * Return type from eventsQuery
 */
type RawEvents = {
  reportData: {
    report: {
      events: Page<Event>
    }
  }
}
// Stuff for handling the different data files, their locations, whether fetching is forced etc...
const dataTypes = ["meta", "events", "actions", "locations"] as const;
type DataType = typeof dataTypes[number];
/**
 * Get the path for a report-level data file
 * @param type Report-level data type
 * @param reportID Report ID
 */
function dataPath(type: "meta", reportID: string): string;
/**
 * Get the path for a fight-level data file
 * @param type Fight-level data type
 * @param reportID Report ID
 * @param fightID Fight ID
 */
function dataPath(type: Exclude<DataType, "meta">, reportID: string, fightID: string): string;
/**
 * Get the path where a given type of data file should be. If the directories
 * leading up to that path don't exist, they will be created at the same time.
 * @param type Data type
 * @param reportID Report ID
 * @param fightID Fight ID, if needed
 * @returns Path where this data file should be
 */
function dataPath(type: DataType, reportID: string, fightID?: string): string {
  let parent, fileName;
  switch(type) {
    case "meta":
      parent = path.resolve(args.outpath, reportID)
      fileName = "meta.json";
      break;
    case "actions":
    case "events":
    case "locations":
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      parent =  path.resolve(args.outpath, reportID, fightID!);
      fileName = `${type}.json`;
      break;
  }
  mkdirSync(parent, {recursive: true});
  return path.resolve(parent, fileName);
}

/**
 * Tests whether a report is going to require action data (so the CSV will need
 * to be loaded).
 *
 * A report needs action data if any of its fights are missing either the events
 * or actions files are missing.
 *
 * This doesn't check the 'force' settings - if force.events or force.actions is
 * true, you should always load action data .
 *
 * @param meta Report to check
 * @returns Whether action data is needed
 */
function needsActionData(meta: Report): boolean {
  return meta.fights.some(
    fight =>
      !existsSync(dataPath("actions", meta.code, `${fight.id}`)) || 
      !existsSync(dataPath("events", meta.code, `${fight.id}`))
  )
}


const parser = new ArgumentParser({description: "Fetch FFLogs report(s) for full analysis"});
parser.add_argument("--list", "-l", {action: "store_true", help: "List the available reports and exit"});
parser.add_argument("reportid", {nargs: "+", help: "Report ID(s) to fetch"});
parser.add_argument("--csv-path", {default: "./dat/", help: "Path to the FFXIV client CSV data files (e.g. Action.csv)"});
parser.add_argument("--outpath", "-o", {default: "./public/analysis-data", help: "Root path to save JSON data in. Default: ./public/analysis-data."});
parser.add_argument("--force-all", "-f", {action: "store_true", help: "Force all fetches, even if a file exists already"});
parser.add_argument("--force", {action:"append", choices: [...dataTypes], help: "Force-fetch a specific type of data (forcing events will also force actions)"});
const args = parser.parse_args() as {
  list: boolean,
  reportid: string[],
  outpath: string,
  force_all: boolean
  force: DataType[]
  csv_path: string,
};
const forced = Object.fromEntries(
  dataTypes.map(
    dataType => [dataType, args.force_all || args.force.includes(dataType)]
  )
) as Record<DataType, boolean>;

// Get a rate limit count before we begin
await getRateLimitData().then(rl => {console.log(`Before running: used ${rl.pointsSpentThisHour}/${rl.limitPerHour} points (${JSON.stringify(rl)})`)});

// Fetch metadata for all reports first, because we use that to determine whether we need to be loading the actions CSV
console.log("Fetching report metadata");
const metaResults = await Promise.allSettled(
  args.reportid.map(
    reportID => importOrFetchMeta(dataPath("meta", reportID), reportID, forced.meta)
  )
);

// If any fetches failed, warn and drop them from the list of reports to process further
metaResults.forEach((result, i) => {
  if(result.status === "rejected") {
    console.warn(`Failed to get metadata for report ${args.reportid[i]}: ${result.reason}`);
  }
});
const reportMetas = metaResults.filter(result => result.status === "fulfilled").map(result => result.value);

if(reportMetas.length === 0) {
  console.warn("No reports to process!");
  exit(1);
}

// Do we *need* the actions CSV? If not, skip loading it, because it's slow!
let actions: Action[] = [];
if(forced.actions || forced.events || reportMetas.some(meta => needsActionData(meta))) {
  const csvPath = path.resolve(args.csv_path, "Action.csv");
  console.log(`Loading actions from ${csvPath}...`)
  actions = parseActionsCSV(readFileSync(csvPath));
} else {
  console.log("Action.csv not required, skipping load");
}

const reportDetailResults = await Promise.allSettled(
  reportMetas.map(
    report =>
      Promise.all(
        report.fights.map(
          async fight => {

          }
        )
      )
  )
);

for(const reportID of args.reportid) {
  const outpath = path.resolve(args.outpath, reportID);
  await promises.mkdir(outpath, {recursive: true});
  const meta = await importOrFetchMeta(dataPath("meta", reportID), reportID, forceMeta);

  for(const fight of meta.fights) {
  // for(const fight of meta.fights.slice(8, 9)) {

    // Make sure the path exists first
    await promises.mkdir(path.resolve(outpath, `${fight.id}`), {recursive: true});
    // Query variables for the FFLogs lookups
    const variables = {
      reportID,
      startTime: fight.startTime,
      endTime: fight.endTime
    };
    
    // Do the locations automatically
    await importOrFetchLocations(path.resolve(outpath, `${fight.id}`, "locations.json"), variables, forceLocations);

    // List of NPC IDs so we can filter out the events
    const fightNPCIDs = fight.enemyNPCs.map(npc => npc.id);

    // Import all the enemy events
    const events = await importOrFetch(
      path.resolve(outpath, `${fight.id}`, "events.json"),
      eventsQuery,
      variables,
      {
        fetch: fetchAllPages(
          (response: RawEvents) => response.reportData.report.events
        ),
        postProcess: (events: Event[]) => events.filter(
          event => {
            if(["cast", "begincast"].includes(event.type) && event.sourceID !== undefined && fightNPCIDs.includes(event.sourceID)) {
              return true;
            }
            else if(["applydebuff", "removedebuff"].includes(event.type) && event.targetID !== undefined && fight.friendlyPlayers.includes(event.targetID)) {
              return true;
            }
            return false;
          }
        ),
        force: forceEvents
      }
    );
    const actionIDs = new Set();
    events.forEach(
      event => {
        actionIDs.add(event.abilityGameID);
        if(event.extraAbilityGameID !== undefined) actionIDs.add(event.extraAbilityGameID);
      }
    )

    const actionsPath = path.resolve(outpath, `${fight.id}`, "actions.json");
    await writeFile(
      actionsPath, 
      JSON.stringify(
        new Array(...actionIDs.values()).map(actionID => actions.find(a => a["#"] == actionID)),
        null,
        2
      )
    );
  }
}

await getRateLimitData().then(rl => {console.log(`After running: used ${rl.pointsSpentThisHour}/${rl.limitPerHour} points`)});
