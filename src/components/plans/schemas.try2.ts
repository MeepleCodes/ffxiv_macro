import { z, ZodAny, ZodArray, ZodDiscriminatedUnion, ZodDiscriminatedUnionOption, ZodObject, ZodType, ZodTypeAny } from "zod";

export type PropType<T extends ZodTypeAny = ZodTypeAny> = T & {propType: PropTypeName};
export type Blueprint = {
  readonly type: string
  readonly properties: Record<string, Readonly<PropType>>
};

export type PropTypeName = "location" | "facing" | "angle" | "distance" | "partlist";

function makeProp<T extends ZodTypeAny>(type: PropTypeName, schema: T): PropType<T> {
  return Object.assign({propType: type}, schema);
}

export const LocationType = makeProp("location", z.object({
  x: z.number().multipleOf(0.01).default(0),
  y: z.number().multipleOf(0.01).default(0),
}));
export const FacingType   = makeProp("facing", z.number().multipleOf(0.01).min(0).max(360).default(0));
export const AngleType    = makeProp("angle", z.number().multipleOf(0.01).min(0).max(360));
export const DistanceType = makeProp("distance", z.number().multipleOf(0.01).min(0));
// export const PartListType = ["partlist", z.lazy(() => Part.array())] as const;

export const BPAoECone = z.object({
  id: z.string(),
  type: z.literal("aoecone"),
  location: LocationType,
  facing: FacingType,
  angle: AngleType,
  range: DistanceType
}) ;
export const BPAoEDonut = z.object({
  id: z.string(),
  type: z.literal("aoedonut"),
  location: LocationType,
  facing: FacingType,
  innerRadius: DistanceType,
  outerRadius: DistanceType
});
const GroupBase = z.object({
  id: z.string(),
  type: z.literal("group"),
});
// expands object types one level deep
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

// expands object types recursively
type ExpandRecursively<T> = T extends object
  ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
  : T;

const UnionBase = z.discriminatedUnion("type", [BPAoECone, BPAoEDonut, GroupBase]);
type GroupFull = z.infer<typeof GroupBase> & {
  elements: Part[]
};
type t = Expand<ZodType<GroupFull>>

export const BPPart: ZodDiscriminatedUnion<
  "type",
  [
    typeof BPAoECone,
    typeof BPAoEDonut,
    ReturnType<
      typeof GroupBase.extend<{
        elements: ZodTypeAny
      }>
    >
  ]
> = z.discriminatedUnion(
  "type", 
  [
    BPAoECone,
    BPAoEDonut,
    GroupBase.extend({
      elements: z.lazy(() => BPPart.array())
    })
  ]);
export type Part = z.infer<typeof BPPart>;

function p(p: Part) {
  if(p.type === "group") {
    p.elements
  }
}