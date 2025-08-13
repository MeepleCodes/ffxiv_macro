/**
 * Load game actions from CSV to Supabase database
 */
import { ArgumentParser } from "argparse";
import { parse } from "csv-parse";
import { createReadStream } from "fs";
import { Buffer } from "buffer";
import { cast, jsDefault, jsName, jsType, makePostgresColumns, sqlName } from "../src/excel/loader";
import supabase from "../src/supabase/client";
import { TablesInsert } from "../src/supabase/database.types";
import path from "path";
import { writeFile } from "fs/promises";
import cliProgress from "cli-progress";



async function makeTypeFile(file: string, with_unknowns: boolean = false): Promise<string> {
  const excelFile = path.basename(file, path.extname(file));
  const tableName = excelFile.toLowerCase() + "s";
  const typeName = excelFile;
  const [headers, types] = await getKeyTypes(file);
  const cols = makePostgresColumns(headers, types);
  const typeMap = types.map((csvType, i) => ({
    index: i,
    unknown: headers[i] === "",
    sqlName: sqlName(headers, i),
    jsName: jsName(headers, i),
    jsType: jsType(csvType),
    default: headers[i] === "Name" ? '"<missing>"' : jsDefault(csvType)
  })).filter(t => t.unknown === false || with_unknowns);
  return `
import { Tables } from '../supabase/database.types.ts';
export const CREATE_SQL = \`CREATE TABLE ${args.table} (
    ${cols.join(',\n    ')}
);\`;

export type ${typeName} = {
  ${typeMap.map(t => `${t.jsName}: ${t.jsType}`).join(",\n  ")}
};

export const unknown${typeName}: ${typeName} = {
  ${typeMap.map(t => `${t.jsName}: ${t.default}`).join(",\n  ")}
}

export function fromSql(row: Tables<"${tableName}">): ${typeName} {
  return {
    ${typeMap.map(t => `${t.jsName}: row.${t.sqlName}`).join(",\n    ")}
  };
}
  `;
}

async function getKeyTypes(file: string): Promise<[string[], string[]]> {
  const csvParser = createReadStream(file).pipe(parse(({from: 2, to: 3})));
  const iter = csvParser[Symbol.asyncIterator]();
  const headers = (await iter.next()).value as string[];
  const types = (await iter.next()).value as string[];
  await iter.return?.();
  return [headers, types];
}

async function printSchema() {
  const [headers, types] = await getKeyTypes(args.csv);
  const cols = makePostgresColumns(headers, types);
  console.log(`
CREATE TABLE ${args.table} (
    ${cols.join(',\n    ')}
);`);
}

import fs from 'node:fs/promises';
import { promises } from "node:dns";

/**
 * Reads a file from the end and returns the final line.
 *
 * This version supports files that end with:
 *   - "\n" (Unix-style, including modern macOS)
 *   - "\r\n" (Windows-style)
 *   - "\r" (older Mac-style, HL7, etc.)
 *
 * @param {string} filePath - The path to the file.
 * @param {number} [minLength=1] - Minimum length for the returned line.
 * @return {Promise<string>} - The last line of the file that meets minLength, or an empty string otherwise.
 */
export async function getLastLine(filePath: string, minLength = 1) {
  const stats = await fs.stat(filePath);
  let fileSize = stats.size;

  // If file is empty, return an empty string
  if (fileSize === 0) return '';

  const fileHandle = await fs.open(filePath, 'r');
  const bufferSize = 1024;
  const buffer = Buffer.alloc(bufferSize);

  let remainder = '';
  let lastLineFound = false;

  try {
    while (!lastLineFound && fileSize > 0) {
      const readSize = Math.min(bufferSize, fileSize);
      fileSize -= readSize;

      // Read a chunk from the current file offset (fileSize)
      const { bytesRead } = await fileHandle.read(buffer, 0, readSize, fileSize);
      const chunkStr = buffer.toString('utf8', 0, bytesRead);

      // Combine with any remainder from the previous chunk
      const combined = chunkStr + remainder;

      // Find the last occurrence of EOL markers
      const lastCRIndex = combined.lastIndexOf('\r');
      const lastLFIndex = combined.lastIndexOf('\n');
      const boundaryIndex = Math.max(lastCRIndex, lastLFIndex);

      if (boundaryIndex !== -1) {
        // The part after this boundary is our last line
        remainder = combined.slice(boundaryIndex + 1);
        lastLineFound = true;
      } else {
        // No line break found in this chunk; keep reading backward
        remainder = combined;
      }
    }
  } finally {
    await fileHandle.close();
  }

  // Clean up any trailing CR or LF from the final line
  remainder = remainder.replace(/[\r\n]+$/, '');

  // Return only if it meets the minimum length
  return remainder.length >= minLength ? remainder : '';
}

async function nextOrThrow<T>(iterator: AsyncIterator<T>): Promise<T> {
  const next = await iterator.next();
  if(next.done === true) throw Error("Out of iteratables");
  return next.value;
}

class TaskQueue<T> {
  public interval_ms = 10;
  private queue: PromiseLike<T>[] = [];
  private complete: boolean = false;
  private block: (() => void) | null = null;
  public add(promise: PromiseLike<T>) {
    const shouldAwaken = this.queue.length == 0;
    this.queue.push(promise);
    if(shouldAwaken) this.unblock();
  }
  public finish() {
    this.complete = true;
  }
  private unblock() {
    this.block?.();
  }
  public async process() {
    while(!this.complete || this.queue.length > 0) {
      if(this.queue.length == 0) {
        const promise = new Promise<void>(resolve => this.block = resolve);
        await promise;
        this.block = null;
      }
      await new Promise(resolve => setTimeout(resolve, this.interval_ms));
      await this.queue.pop();
      
    }
  }
}


async function update() {
  const lastLine = await getLastLine(args.csv);
  const maxID = lastLine ? parseInt(lastLine.split(",")[0], 10) : 50000;

  const progress = new cliProgress.MultiBar(
    {
      clearOnComplete: false,
      hideCursor: true,
      format: '{label} | {bar} | {value}/{total}',
    }, cliProgress.Presets.shades_classic
  );
  const parseProgress = progress.create(maxID, 0,  {label: "Parse CSV"});
  const upsertProgress = progress.create(maxID, 0, {label: "Update DB"});

  const csvParser = createReadStream(args.csv).pipe(parse(({from: 2})));
  const iterator = csvParser[Symbol.asyncIterator]() as AsyncIterableIterator<string[]>;
  const colRow = await nextOrThrow(iterator);
  const colmap = colRow.map((key, i) => ([key === "" ? "" : sqlName(colRow, i), i] as [string, number])).filter(([key, _]) => key !== "");
  const types = await nextOrThrow(iterator);
  let errorcount = 0;

  const queue = new TaskQueue<unknown>();
  async function iterateCsv() {
    for await(const row of iterator) {
      const rowObject = Object.fromEntries(
          colmap.map(([name, idx]) => ([
            name,
            cast(types, row[idx], idx)
          ]))
        ) as TablesInsert<{schema: "public"}, "actions">;
      queue.add(supabase
        .schema("public")
        .from("actions")
        .upsert(
          rowObject
        )
        .then(
          ({error}) => {
            upsertProgress.increment();
            if(error) {
              errorcount += 1;
              
              if(errorcount > 10000) {
                console.error(`PostgreSQL error ${error.code}: ${error.details}, ${error.message}`);
                if(error.cause !== undefined) console.error(error.cause);
                throw error;
              }
              return new Promise(resolve => setTimeout(resolve, 500));
            }
            
          }
        )
      );
      parseProgress.update(rowObject["id"]);
    }
    queue.finish();
  }
  await Promise.all([iterateCsv(), queue.process()]).catch((e: unknown) => {console.error(e);});

  progress.stop();
}

const parser = new ArgumentParser({description: "Load actions from CSV to Supabase"});
parser.add_argument("--schema", "-s", {action: "store_true", help: "Print the table schema and exit"});
parser.add_argument("--types", "-t", {action: "store_true", help: "Make type file and exit"});
parser.add_argument("csv", {help: "CSV file to parse"});
// TODO: Make this fetch from https://raw.githubusercontent.com/xivapi/ffxiv-datamining/refs/heads/master/csv/Action.csv
const args = parser.parse_args() as {
  schema: boolean,
  types: boolean,
  csv: string,
  table: string,
};
if(args.schema) {
  void printSchema();
} else if(args.types) {
  void makeTypeFile(args.csv, false).then(s => 
    writeFile(
      "src/excel/Action.types.ts",
      s
    )
  );
} else {
  void update();
}