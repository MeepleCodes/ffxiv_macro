import { z, ZodDiscriminatedUnionOption, ZodType, ZodTypeAny, ZodTypeDef } from "zod";


export type PropTypeName = "location" | "facing" | "angle" | "distance" | "colour" | "opacity" | "partlist";
export interface PropType<T, Def extends ZodTypeDef = ZodTypeDef, Input = T> {
  name: PropTypeName;
  schema: ZodType<T, Def, Input>;
  lerp: ((from: T, to: T, frame: number) => T) | null;
}
function makePropType<
  T,
  Def extends ZodTypeDef = ZodTypeDef,
  Input = T
>(name: PropTypeName,
  schema: ZodType<T, Def, Input>,
  lerp: ((from: T, to: T, t: number) => T) | null
): PropType<T, Def, Input> {
  return {name, schema, lerp}
}

/**
 * Simple lerp for numberical values
 * @param from Starting value
 * @param to Final value
 * @param t Interpolation amount (range 0.0-1.0)
 * @returns Interpolation value
 */
function lerpNumber(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

export const LocationType = makePropType(
  "location",
  z.object({
    x: z.number().multipleOf(0.01).default(0),
    y: z.number().multipleOf(0.01).default(0),
  }),
  (from, to, t) => ({
    x: lerpNumber(from.x, to.x, t),
    y: lerpNumber(from.y, to.y, t)
  })
);
export const FacingType   = makePropType(
  "facing",
  z.number().multipleOf(0.01).min(0).max(360).default(0),
  lerpNumber
);
export const AngleType = makePropType(
  "angle",
  z.number().multipleOf(0.01).min(0).max(360),
  lerpNumber
);
export const DistanceType = makePropType(
  "distance",
  z.number().multipleOf(0.01).min(0),
  lerpNumber
);
export const ColourType = makePropType("colour",
  z.object({
    r: z.number().int().min(0).max(255),
    g: z.number().int().min(0).max(255),
    b: z.number().int().min(0).max(255),
  }),
  (from, to, t) => ({
    r: lerpNumber(from.r, to.r, t),
    g: lerpNumber(from.g, to.g, t),
    b: lerpNumber(from.b, to.b, t)
  })
);
export const OpacityType = makePropType(
  "opacity",
  z.number().min(0).max(1).default(1),
  lerpNumber
);
export const PartListType = makePropType(
  "partlist",
  z.lazy(() => _PartSchema.array()),
  null
);

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
/** The runtime list of types */
export const BPTypes = Object.keys(Blueprints) as PartType[];
export type PartProperty<PartType extends keyof typeof Blueprints, PropName extends keyof (typeof Blueprints[PartType])> = {
  name: PropName,
  type: typeof Blueprints[PartType][PropName]
};

export type PartPropertyMap =  {
  [P in keyof typeof Blueprints]: PartProperty<P, keyof typeof Blueprints[P]>[]
}
/** The runtime map of PartType to properties of that part */
export const BPProperties = Object.fromEntries(
  Object.entries(Blueprints).map(([partName, part]) => 
    ([
      partName,
      Object.entries(part).map(([propName, propType]) => ({
        name: propName,
        type: propType as unknown
      }))
    ])
  )
) as PartPropertyMap;


/**
 * Manually re-derive the (output) type of a Blueprint with PartType T.
 * 
 * We need to go through a distributive spread so make an intermediate type first
 */
type BPOutput<PartT extends PartType> = {
  [PropName in keyof typeof Blueprints[PartT]]: 
    // PropName extends "elements" ? 
    typeof Blueprints[PartT][PropName] extends typeof PartListType ?
      AnyPart[] :
        "schema" extends keyof typeof Blueprints[PartT][PropName] ?
          typeof Blueprints[PartT][PropName]["schema"] extends ZodTypeAny ? 
            z.infer<typeof Blueprints[PartT][PropName]["schema"]> :
            never :
        never
        // never
} & {
  id: string,
  type: PartT
};


/** The properties of a Part with type: T */
export type Part<T extends PartType> = T extends PartType ? BPOutput<T> : never;
/** The union of all allowed Part<> types */
export type AnyPart = Part<PartType>;

type circle = Part<"aoecircle">;


// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Blueprint = Record<string, PropType<any>>
function blueprintToZod(type: PartType, print: Blueprint): ZodDiscriminatedUnionOption<"type"> {
  return z.object(
    Object.fromEntries(
      Object.entries(print).map(
        ([key, value]) =>
          [key, value.schema]
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

