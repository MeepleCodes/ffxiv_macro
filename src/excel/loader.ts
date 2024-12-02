import { CastingContext } from "csv-parse";
import { parse } from "csv-parse/sync";
import { RowType } from "./excel";

export function makeCast (types: readonly string[]) {
  return function(value: string, context: CastingContext) {
    const typeName = types.at(context.index);
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
}

export function makeColumns(keys: readonly string[]) {
  return keys.map(key => key === "" ? undefined : key);
}
export function parseCSV<K extends readonly string[], T extends readonly string[]>(data: string | Buffer, keys: K, types: T) {
  return parse(data, {columns: makeColumns(keys), cast: makeCast(types), from_line: 4}) as Array<RowType<K, T>>;
}