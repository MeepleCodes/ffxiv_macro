import { CastingContext } from "csv-parse";
import { parse } from "csv-parse/sync";
import { parse as pipelineParse } from "csv-parse";
import { RowType } from "./excel";
import { inputAdornmentClasses, useForkRef } from "@mui/material";

export function cast(types: readonly string[], value: string, index: number) {
  const typeName = types.at(index);
  if(typeName === "str" || typeName === undefined) {
    return value;
  } else if(typeName.startsWith("bit&")) {
    return value === "True"
  } else {
    try {
      return parseInt(value, 10);
    } catch {
      return value;
    }
  }
}

export function makeCast (types: readonly string[]) {
  return function(value: string, context: CastingContext) {
    return cast(types, value, context.index);
  }
}

/**
 * Pick the correct PostgreSQL type from the type row of a CSV file
 * 
 * @param csvType CSV type
 * @returns Equivalent PostgreSQL type
 */
export function sqlType(csvType: string): string {
  // All bit&<mask> types are boolean
  if(csvType.startsWith("bit&")) return "boolean";
  // Things that are not the default (int32)
  switch(csvType) {
    case "str": return "text";
    case "byte":
    case "sbyte": 
      // Postgres doesn't have 1-byte ints, so use 2
      return "smallint";
    // uint16 has to be int32 because we don't have unsigned ints in postgres
    default: return "integer";
  }

}

export function sqlName(keys: readonly string[], i: number): string {
  const csvName = keys[i];
  if(csvName === "#") return "id";
  if(csvName === "") return `_unknown_${i}`;
  const base = csvName.replace(/[^a-zA-Z0-9_-]/g, "");
  let sqlName = "";
  for(let i=0; i<base.length; i++) {
    const c = base[i];
    const lower = c.toLowerCase();
    if(lower !== c) {
      // Only insert a space if this isn't the first or last character and it
      // doesn't follow a previous capital (so you don't turn 'VFX' into
      // 'v_f_x')
      if(i > 0 && i < base.length -1 && base[i-1].toLowerCase() === base[i-1]) {
        sqlName += "_";
      }
      sqlName += lower;
    } else {
      sqlName += c;
    }
  }
  return sqlName;
}

export function jsName(keys: readonly string[], i: number): string {
  const csvName = keys[i];
  if(csvName === "#") return "id";
  if(csvName === "") return `_unknown_${i}`;
  const safeName = csvName.replace(/[^a-zA-Z0-9_-]/g, "");
  if(safeName.match(/^[A-Z]*$/)) return safeName.toLowerCase();
  return safeName[0].toLowerCase() + safeName.slice(1);
}

export function jsType(csvType: string): string {
  // All bit&<mask> types are boolean
  if(csvType.startsWith("bit&")) return "boolean";
  switch(csvType) {
    case "str": return "string";
    default: return "number";
  }
}

export function jsDefault(csvType: string): string {
  switch(jsType(csvType)) {
    case "boolean": return "false";
    case "string": return '""';
    case "number": return "-1";
    default: return "undefined";
  }
}

/**
 * Make a postgres schema definition from the keys and types of a CSV file
 * @param keys Column names
 * @param types Column types
 * @returns SQL fragment
 */
export function makePostgresColumns(keys: readonly string[], types: readonly string[], with_unknowns = false): string[] {
  if(keys.length !== types.length) throw new Error("Key/type arrays must be the same size");
  const cols: string[] = [];
  for(let i=0; i<keys.length; i++) {
    // Skip any unnamed columns
    if(keys[i] === "#") {
      cols.push("id integer PRIMARY KEY");
    } else if (keys[i] === "" && !with_unknowns) {
      continue;
    } else {
      const colname = sqlName(keys, i);
      cols.push(`${colname} ${sqlType(types[i])} NOT NULL`);
    }
  }
  return cols;
}

export function makeColumns(keys: readonly string[]) {
  return keys.map(key => key === "" ? undefined : key);
}

export function parseCSV<K extends readonly string[], T extends readonly string[]>(data: string | Buffer, keys: K, types: T) {
  return parse(data, {columns: makeColumns(keys), cast: makeCast(types), from_line: 4}) as Array<RowType<K, T>>;
}
