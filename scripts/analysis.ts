/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import path from "path";
import { makeFetchAllQuery, importOrFetch } from "../src/fflogs/backend";
import { Page } from '../src/fflogs/client';
import { importOrFetchMeta, Report, ReportFight, ReportIndex } from "../src/fflogs/reports";
import { Event } from "../src/fflogs/types";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { getRateLimitData } from "../src/fflogs/ratelimits";
import { Action, ActionKeys, ActionTypes } from "../src/excel/Action";
import { importOrFetchLocations } from "../src/fflogs/locations";
import { readFile, writeFile } from "fs/promises";
import { ArgumentParser } from "argparse";
import { exit } from "process";
import { parseCSV } from "../src/excel/loader";

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
function reportNeedsActionData(meta: Report): boolean {
  return meta.fights.some(fight => fightNeedsActionData(meta.code, fight));
}
/**
 * Tests whether a single fight in a report is going to require action data
 * 
 * @param reportID Report the fight belongs to
 * @param fight Fight data
 * @returns If the fight needs action data
 */
function fightNeedsActionData(reportID: string, fight: ReportFight): boolean {
    return !existsSync(dataPath("actions", reportID, `${fight.id}`)) || 
      !existsSync(dataPath("events", reportID, `${fight.id}`));
}


const parser = new ArgumentParser({description: "Fetch FFLogs report(s) for full analysis"});
parser.add_argument("--list", "-l", {action: "store_true", help: "List the available reports and exit"});
parser.add_argument("reportid", {nargs: "+", help: "Report ID(s) to fetch"});
parser.add_argument("--csv-path", {default: "./dat/", help: "Path to the FFXIV client CSV data files (e.g. Action.csv)"});
parser.add_argument("--outpath", "-o", {default: "./public/analysis-data", help: "Root path to save JSON data in. Default: ./public/analysis-data."});
parser.add_argument("--force-all", "-f", {action: "store_true", help: "Force all fetches, even if a file exists already"});
parser.add_argument("--force", {action:"append", choices: [...dataTypes], help: "Force-fetch a specific type of data (forcing events will also force actions)"});
parser.add_argument("--extra-actions", {type: "int", default: 10, help: "Number of extra CSV actions to include before and after any action IDs actually seen in a fight"})
parser.add_argument("--fight", {type: "int", action: "append", help: "Only process this fight ID (can specify multiple times)"})
parser.set_defaults({force: [], fight: []})
const args = parser.parse_args() as {
  list: boolean,
  reportid: string[],
  outpath: string,
  force_all: boolean
  force: DataType[]
  csv_path: string,
  extra_actions: number,
  fight: number[]
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
  console.warn("No reports left to process!");
  exit(1);
}

// Do we *need* the actions CSV? If not, skip loading it, because it's slow!
let actions: Action[] = [];
if(forced.actions || forced.events || reportMetas.some(meta => reportNeedsActionData(meta))) {
  const csvPath = path.resolve(args.csv_path, "Action.csv");
  console.log(`Loading actions from ${csvPath}...`)
  actions = parseCSV(readFileSync(csvPath), ActionKeys, ActionTypes);
} else {
  console.log("Action.csv not required, skipping load");
}

const reportDetailResults = await Promise.allSettled(
  reportMetas.map(
    report =>
      Promise.all(
        report.fights.filter(fight => args.fight.length == 0 || args.fight.includes(fight.id)).map(
          async (fight) => {
            const reportID = report.code;
            const fightID = `${fight.id}`;
            // Query variables for the FFLogs lookups
            const variables = {
              reportID,
              startTime: fight.startTime,
              endTime: fight.endTime
            };
            
            // Always do the locations
            await importOrFetchLocations(dataPath("locations", reportID, fightID), variables, forced.locations);

            // Decide whether we're going to fetch actions *before* fetching
            // events (because if we had to fetch events we want to regenerate
            // actions).
            const fetchActions = forced.actions || forced.events || fightNeedsActionData(reportID, fight);

            // List of NPC IDs so we can filter out the events
            const fightNPCIDs = fight.enemyNPCs.map(npc => npc.id);
            // Import all the enemy events
            const events = await importOrFetch(
              dataPath("events", reportID, fightID),
              eventsQuery,
              variables,
              {
                fetch: makeFetchAllQuery(
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
                force: forced.events
              }
            );
            if(fetchActions) {
              // Make a list of actions we saw used
              const actionIDs = new Set<number>();
              events.forEach(
                event => {
                  actionIDs.add(event.abilityGameID);
                  if(event.extraAbilityGameID !== undefined) actionIDs.add(event.extraAbilityGameID);
                }
              );
              const sortedIDs = [...actionIDs].sort((a, b) => a-b);
              console.log(`Loading XIV data for actions: ${sortedIDs.map(i => i.toString()).join(", ")}`)
              const slices = [];
              const fightActions: Action[] = [];
              while(sortedIDs.length > 0) {
                const start = sortedIDs.shift()! - args.extra_actions;
                let end = start + args.extra_actions * 2;
                while(sortedIDs.length > 0 && sortedIDs[0] - args.extra_actions <= end) {
                  end = sortedIDs.shift()! + args.extra_actions;
                }
                slices.push([start, end])
                fightActions.push(...actions.slice(start, end+1));
              }
              console.log("Grouped to: ", slices)


              const actionsPath = dataPath("actions", reportID, fightID);
              await writeFile(
                actionsPath, 
                JSON.stringify(
                  fightActions,
                  null,
                  2
                )
              );
            }
            return true;
          } // end of fights.map
        )
      )
  )
);
reportDetailResults.forEach((result, i) => {
  if(result.status === "rejected") {
    console.warn(`Fetching fight(s) data for report ${reportMetas[i].code} failed: ${result.reason}`);
    if(result.reason instanceof Error) {
      console.warn(result.reason.stack);
    }
  } else {
    console.log(`Fight(s) data for report ${reportMetas[i].code} up to date`);
  }
})

// Update the reportIDs.json
const idsFile = path.resolve(args.outpath, "reports.json")
const current = await readFile(idsFile, {encoding: "utf-8"}).then(
  data => JSON.parse(data) as ReportIndex[]
).catch(
  (e: unknown) => {
    console.log("Error reading existing report IDs", e);
    return [] as ReportIndex[];
  }
);
const unchanged = current.filter(report => !reportMetas.some(newReport => newReport.code === report.code));
const newIndex = reportMetas.map(fullReport => ({code: fullReport.code, title: fullReport.title, startTime: fullReport.startTime, endTime: fullReport.endTime}))
console.log("Keeping existing data for reports", unchanged);
console.log("Adding new data for reports", newIndex);
const newReportIndex: ReportIndex[] = [
  ...unchanged,
  ...newIndex
];
writeFileSync(idsFile, JSON.stringify(newReportIndex));
await getRateLimitData().then(rl => {console.log(`After running: used ${rl.pointsSpentThisHour}/${rl.limitPerHour} points`)});
