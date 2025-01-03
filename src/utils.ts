import { Theme } from "@mui/material";
import { SxProps } from "@mui/system";

let count: number = 1;
const idMap: WeakMap<Record<string, unknown> | Array<unknown>, number> = new WeakMap<Record<string, unknown> | Array<unknown>, number>();
export function getObjectId(object: Record<string, unknown> | Array<unknown>): number {
  const objectId: number | undefined = idMap.get(object);
  if (objectId === undefined) {
    count += 1;
    idMap.set(object, count);

    return count;
  }

  return objectId;
}

// expands object types one level deep
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

// expands object types recursively
export type ExpandRecursively<T> = T extends object
  ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
  : T;

/**
 * Typesafe merging of multiple, optional sx props, for use in custom
 * components.
 *
 * Arguments can be undefined, so this handles optional props. The last prop in
 * the list will take priority so you can use this to determine which sx
 * properties are overrideable in your component.
 *
 * @param sxs sx prop(s) to merge
 * @returns A single sx prop
 */
export function mergeSx(...sxs: (SxProps<Theme> | undefined)[]): SxProps<Theme> {
  return (sxs.filter(sx => sx !== undefined)).flat(2);
}