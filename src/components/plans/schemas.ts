import { z, ZodDiscriminatedUnionOption, ZodType, ZodTypeAny } from "zod";

export type PropType = [PropTypeName, ZodTypeAny];
export type Blueprint = Record<string, Readonly<PropType>>;

export type PropTypeName = "location" | "facing" | "angle" | "distance" | "colour" | "opacity" | "partlist";
export const LocationType = ["location", z.object({
  x: z.number().multipleOf(0.01).default(0),
  y: z.number().multipleOf(0.01).default(0),
})] as const;
export const FacingType   = ["facing", z.number().multipleOf(0.01).min(0).max(360).default(0)] as const;
export const AngleType    = ["angle", z.number().multipleOf(0.01).min(0).max(360)] as const;
export const DistanceType = ["distance", z.number().multipleOf(0.01).min(0)] as const;
export const ColourType   = ["colour", z.object({
  r: z.number().int().min(0).max(255),
  g: z.number().int().min(0).max(255),
  b: z.number().int().min(0).max(255),
})] as const;
export const OpacityType  = ["opacity", z.number().min(0).max(1).default(1)] as const;
export const PartListType = ["partlist", z.lazy(() => _PartSchema.array())] as const;

export const Blueprints = {
  "aoecone": {
    location: LocationType,
    facing: FacingType,
    angle: AngleType,
    range: DistanceType,
    colour: ColourType,
    opacity: OpacityType
  },
  "aoedonut": {
    location: LocationType,
    facing: FacingType,
    innerRadius: DistanceType,
    outerRadius: DistanceType,
    colour: ColourType,
    opacity: OpacityType,
  },
  "aoecircle": {
    location: LocationType,
    radius: DistanceType,
    colour: ColourType,
    opacity: OpacityType,
  },
  "group": {
    elements: PartListType
  }
} as const;

/** The acceptable values of 'type' for a Part */
export type PartType = keyof typeof Blueprints;

/**
 * Manually re-derive the (output) type of a Blueprint with PartType T.
 * 
 * We need to go through a distributive spread so make an intermediate type first
 */
type BPOutput<T extends PartType> = {
  [k in keyof typeof Blueprints[T]]: 
    k extends "elements" ? 
      AnyPart[]
    : typeof Blueprints[T][k] extends Readonly<[PropTypeName, ZodTypeAny]> ?
      z.infer<typeof Blueprints[T][k][1]> :
      never
} & {
  id: string,
  type: T
} 
/** The properties of a Part with type: T */
export type Part<T extends PartType> = T extends PartType ? BPOutput<T> : never;
/** The union of all allowed Part<> types */
export type AnyPart = Part<PartType>;

/** The properties of a keyframe of a Part<T> */
export type PartKeyframe<T extends PartType> = Partial<Omit<Part<T>, "id"|"type">> & {
  id: string,
  frame: number
}

function blueprintToZod(type: PartType, print: Blueprint): ZodDiscriminatedUnionOption<"type"> {
  return z.object(
    Object.fromEntries(
      Object.entries(print).map(
        ([key, value]) =>
          [key, value[1]]
      )
    )
  ).extend({
    id: z.string(),
    type: z.literal(type)
  });
}

const ZodSchemas: ZodDiscriminatedUnionOption<"type">[] = Object.entries(Blueprints).map(
  ([key, value]) => 
    blueprintToZod(key as keyof typeof Blueprints, value)
);

// The casting of ZodSchemas loses all our typing information here, so we have to replace it later
const _PartSchema = z.discriminatedUnion("type", [...ZodSchemas] as [ZodDiscriminatedUnionOption<"type">, ...Array<ZodDiscriminatedUnionOption<"type">>]);
export const PartSchema: ZodType<AnyPart> = _PartSchema as unknown as ZodType<AnyPart>;
// type AnyPart = z.infer<typeof PartSchema.options[number]>;

