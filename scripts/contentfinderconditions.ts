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
import { ContentFinderConditionKeys, ContentFinderConditionTypes } from "../src/excel/ContentFinderCondition";

const parser = new ArgumentParser({description: "Export id->name mapping for ContentFinderConditions from CSV"});
parser.add_argument("--csv-path", {default: "./dat/ContentFinderCondition.csv", help: "Path to the CSV data file"});
parser.add_argument("--output", "-o", {default: "./src/waymarks/territories.json", help: "Output file. Default: ./src/waymarks/territories.json"});
const args = parser.parse_args() as {
  csv_path: string,
  output: string,
};
console.log(`Loading content finder conditions from ${args.csv_path}...`)
const contentFinderConditions = parseCSV(readFileSync(args.csv_path), ContentFinderConditionKeys, ContentFinderConditionTypes);
const contentMap = Object.fromEntries(
  contentFinderConditions.filter(row => row.Name !== "").map(row =>
  [
    row["#"],
    row.Name
  ]
  )
);
writeFileSync(args.output, JSON.stringify(contentMap, null, 2));
console.log(`Saved ${Object.entries(contentMap).length} content names to ${args.output}`)
