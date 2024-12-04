import aacm1 from "../analysis/aac/aacm1.jpg";
import aacm2 from "../analysis/aac/aacm2.jpg";
import aacm3 from "../analysis/aac/aacm3.jpg";
import PlanPlayer from "./PlanPlayer";
import SafeSpot from "./SafeSpot";
import PlanCast from "./PlanCast";
import LayerWrapper from "./LayerWrapper";
import AoEDonut from "./AoEDonut";
import HitBox from "./HitBox";

// type Renderer<P> = {
//   fn: (props: P) => React.ReactNode,
//   wrapper?: (props: {wrapped: P}) => React.ReactNode
// }

export const LayerTypes = {
  "layer": {fn: LayerWrapper},
  "safespot": {fn: SafeSpot}
} as const;

export type Layer = {
  [key in keyof typeof LayerTypes]: {
    readonly type: key,
    readonly id: string,
    readonly children: Part[]
  } & Parameters<(typeof LayerTypes)[key]["fn"]>[0]
}[keyof typeof LayerTypes];

export const PartTypes = {
  "player": {fn: PlanPlayer},
  "cast": {fn: PlanCast},
  "AoEDonut": {fn: AoEDonut},
  "hitbox": {fn: HitBox},
} as const;

// The useless conditional forces this to be distribute over the union so we get
// {type: "A", ...AProps} | {type: "B", ...BProps} and not {type: "A" | "B",
// ...AProps, ...BProps}
export type Part<key extends keyof typeof PartTypes = keyof typeof PartTypes> = key extends keyof typeof PartTypes ? {
  readonly type: key,
  readonly id: string  
} & Parameters<(typeof PartTypes)[key]["fn"]>[0] : never;

// export type DraggablePart = {
//   [key in keyof typeof PartTypes]: (typeof PartTypes)[key]["draggable"] extends true ? ({
//     readonly type: key,
//     readonly id: string
//   } & Parameters<(typeof PartTypes)[key]["fn"]>[0]) : never
// }[keyof typeof PartTypes];


// export type FixedPart = {
//   [key in keyof typeof PartTypes]: (typeof PartTypes)[key]["draggable"] extends false ? ({
//     readonly type: key,
//     readonly id: string
//   } & Parameters<(typeof PartTypes)[key]["fn"]>[0]) : never
// }[keyof typeof PartTypes];

// export type Part = DraggablePart; //| FixedPart; Current we don't have any fixed parts


// /**
//  * 
//  * @param part Part to check
//  * @returns If it's draggable (having x, y properties)
//  */
// export function isDraggable(part: Part): part is DraggablePart {
//   return PartTypes[part.type].draggable;
// }

// export type Part = {
//   [key in keyof typeof PartTypes]: {
//     readonly type: key,
//     readonly id: string
//   } & Parameters<(typeof PartTypes)[key]["fn"]>[0]
// }[keyof typeof PartTypes];

export type ZoneProps = {
  readonly image: string,
  readonly scale?: number
}

export type Zone = ZoneProps | keyof typeof Zones;

export const Zones: Record<string, ZoneProps> = {
  "aacm1": { image: aacm1 },
  "aacm2": { image: aacm2 },
  "aacm3": {
    image: aacm3,
    scale: 0.75
  }
} as const;

export interface Plan {
  zone: Zone;
  layers: Layer[]
}