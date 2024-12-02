/** Literals that are used for the raw types of bitfield columns */
export type BitField = `bit&${0|1|2}${0|1|2|3|4|5|6|7|8|9}` | `bit&3${0|1}`;
/** Derive a type that is the union of all column names in a Keys const array */
export type KeyIndex<K extends readonly string[]> = Exclude<keyof K, keyof []>;
/** Derive a type that is {[key]: js_type} for all keys in a Keys const array */
export type KeyTypeMap<T extends readonly string[]> =  {
  [key in keyof T]: 
    T[key] extends BitField ? 
      boolean : 
      T[key] extends "str" ?
        string :
        number;
}
export type RowType<K extends readonly string[], T extends readonly string[]> = {
  [key in KeyIndex<K> as K[key] extends Exclude<K[number], ""> ? K[key] : never]:
    key extends keyof KeyTypeMap<T> ? KeyTypeMap<T>[key] : never; 
}
export function ColumnNames(keys: readonly string[]): (string|undefined)[] {
  return keys.map(key => key === "" ? undefined : key);
}