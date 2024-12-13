import { z } from "zod";
import { Zones } from "../drawing/zones";

export const LocationType = z.object({
  x: z.number().multipleOf(0.01).default(0),
  y: z.number().multipleOf(0.01).default(0),
});
export const FacingType = z.number().multipleOf(0.01).min(0).max(360).default(0);
export const AngleType = z.number().multipleOf(0.01).min(0).max(360);
export const DistanceType = z.number().multipleOf(0.01).min(0);
export const ColourType = z.object({
  r: z.number().int().min(0).max(255),
  g: z.number().int().min(0).max(255),
  b: z.number().int().min(0).max(255),
});
export const OpacityType = z.number().min(0).max(1).default(1);

/**
 * Base schema for parts
 */
const PartBase = z.object({
  id: z.string()
});

/**
 * Base schema for Timelines
 */
const TimelineBase = z.object({
  id: z.string(),
  type: z.literal("timeline"),
})

/**
 * Create two schemas from the base property definitions of a Part.
 * 
 * The part schema looks like:
 * ```
 * {
 *  id: string,
 *  type: <type>,
 *  ...<shape>
 * }
 * ```
 * 
 * And the timeline schema looks like:
 * ```
 * {
 *  id: string,
 *  type: "timeline",
 *  part: {
 *    id: string,
 *    type: <type>
 *    ...<shape>
 *  },
 *  keyframes: Array<{
 *    frame: number,
 *    changes: {
 *      [keyof shape]?: {
 *        newValue: shape[key],
 *        lerp: boolean
 *      }
 *    }
 *  }>
 * }
 * ```
 * 
 * @param type Name of the part type
 * @param shape Shape of the definition of the part
 * @returns A tuple of [PartSchema, TimelineSchema]
 */
function schema<T extends string, U extends z.ZodRawShape>(type: T, shape: U) {
  const partSchema = PartBase.extend({
    type: z.literal(type)
  }).extend(shape);
  return [
    partSchema,
    TimelineBase.extend({
      part: partSchema,
      keyframes: z.object({
        frame: z.number(),
        changes: z.object(
          Object.fromEntries(
            Object.entries(shape).map(
              ([key, value]) => ([
                key,
                z.object({
                  newValue: value,
                  lerp: z.boolean()
                })
              ])
            )
          ) as {
            [k in keyof U & keyof z.ZodRawShape]: z.ZodObject<{
              newValue: U[k],
              lerp: z.ZodBoolean
            }>
          }
        ).partial()
      }).array()
    })
  ] as const;
}

export const [AoEConeSchema, AoEConeTimeline] = schema("aoecone", {
  // type: z.literal("aoecone"),
  location: LocationType,
  facing: FacingType,
  angle: AngleType,
  range: DistanceType,
  colour: ColourType,
  opacity: OpacityType
});

export const [AoEDonutSchema, AoEDonutTimeline] = schema("aoedonut", {
  location: LocationType,
  innerRadius: DistanceType,
  outerRadius: DistanceType,
  colour: ColourType,
  opacity: OpacityType,
});

export const [AoECircleSchema, AoECircleTimeline] = schema("aoecircle", {
  location: LocationType,
  radius: DistanceType,
  colour: ColourType,
  opacity: OpacityType,
});

const [baseGroupSchema, GroupTimeline] = schema("group", {
  location: LocationType,
});
export {GroupTimeline};

const baseSchemas = [ AoEConeSchema, AoEDonutSchema, AoECircleSchema] as const;
type BasesInputType = z.input<z.ZodUnion<typeof baseSchemas>>;
type BasesOutputType = z.output<z.ZodUnion<typeof baseSchemas>>;


type FullInputType = BasesInputType | (z.input<typeof baseGroupSchema> & {"elements": FullInputType[]});
type FullOutputType = BasesOutputType | (z.output<typeof baseGroupSchema> & {"elements": FullOutputType[]});

export const PartSchema: z.ZodType<FullOutputType, z.ZodTypeDef, FullInputType> = z.discriminatedUnion("type", [baseGroupSchema.extend({
  elements: z.lazy(() => PartSchema.array())
}), ...baseSchemas]);
export type Part = z.infer<typeof PartSchema>;


// Can't make a discriminated union on a nested property, so leave this as-is for now
export const TimelineSchema = z.union([AoECircleTimeline, AoEConeTimeline, AoEDonutTimeline, GroupTimeline]);
export type Timeline = z.infer<typeof TimelineSchema>;
// export type Keyframe = Timeline["keyframes"][number];

const castOmits = {colour: true, opacity: true} as const;
export const CastPartSchema = z.discriminatedUnion("type", [
  AoECircleSchema.omit(castOmits),
  AoEConeSchema.omit(castOmits),
  AoEDonutSchema.omit(castOmits)
]);
export type CastPart = z.infer<typeof CastPartSchema>;
export const CastAnimationSchema = z.object({
  id: z.string(),
  type: z.literal("cast"),
  part: CastPartSchema,
  castFrame: z.number(),
  omenFrames: z.number().default(0),
  castFrames: z.number().default(0),
  fadeFrames: z.number().default(10)
});

export type CastAnimation = z.infer<typeof CastAnimationSchema>;

export const AnimationPartSchema = z.union([TimelineSchema, CastAnimationSchema]);
export type AnimationPart = z.infer<typeof AnimationPartSchema>;

type z = keyof typeof Zones;
export const ZoneSchema = z.union([
  z.enum(Object.keys(Zones) as [z, ...z[]]),
  z.object({
    image: z.string(),
    scale: z.number().optional()
  })
]);

export const AnimatedPlanSchema = z.object({
  zone: ZoneSchema,
  frames: z.number(),
  startFrame: z.number().default(0),
  parts: AnimationPartSchema.array()
});
export type AnimatedPlanConfig = z.infer<typeof AnimatedPlanSchema>;