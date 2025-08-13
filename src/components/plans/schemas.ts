import { Primitive, z } from "zod";
import { Zones } from "../drawing/zones";

export const CoordSchema = z.number().multipleOf(0.01).default(0);

export const LocationType = z.object({
  x: CoordSchema,
  y: CoordSchema,
});
export const FacingSchema = z.number().multipleOf(0.01).min(0).max(360).default(0);
export const AngleSchema = z.number().multipleOf(0.01).min(0).max(360);
export const DistanceSchema = z.number().multipleOf(0.01).min(0);
export const ColourSchema = z.object({
  r: z.number().int().min(0).max(255),
  g: z.number().int().min(0).max(255),
  b: z.number().int().min(0).max(255),
});
export const OpacitySchema = z.number().min(0).max(1).default(1);

/**
 * Base schema for parts
 */
const PartBase = z.object({
  id: z.string(),
  name: z.string()
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
  x: CoordSchema,
  y: CoordSchema,
  facing: FacingSchema,
  angle: AngleSchema,
  range: DistanceSchema,
  colour: ColourSchema,
  opacity: OpacitySchema
});

export const [AoEDonutSchema, AoEDonutTimeline] = schema("aoedonut", {
  x: CoordSchema,
  y: CoordSchema,
  innerRadius: DistanceSchema,
  outerRadius: DistanceSchema,
  colour: ColourSchema,
  opacity: OpacitySchema,
});

export const [AoECircleSchema, AoECircleTimeline] = schema("aoecircle", {
  x: CoordSchema,
  y: CoordSchema,
  range: DistanceSchema,
  colour: ColourSchema,
  opacity: OpacitySchema,
});

export const [AoERectSchema, AoERectTimeline] = schema("aoerect", {
  x: CoordSchema,
  y: CoordSchema,
  facing: FacingSchema,
  width: DistanceSchema,
  height: DistanceSchema,
  colour: ColourSchema,
  opacity: OpacitySchema,  
});

export const CastMarkerSchema = PartBase.extend({
  type: z.literal("cast"),
  x: CoordSchema,
  y: CoordSchema,
  facing: FacingSchema,
  colour: ColourSchema,
  opacity: OpacitySchema,
  // Only the parts of Action that we need for drawing
  action: z.object({
    id: z.number(),
    castType: z.number(),
    xAxisOffset: z.number(),
    effectRange: z.number(),
  }).nullable()  // If null, we haven't set an action yet (won't render, but can click to edit)
});

export const WaymarkSchema = PartBase.extend({
  type: z.literal("waymark"),
  
})

const [baseGroupSchema, GroupTimeline] = schema("group", {
  x: CoordSchema,
  y: CoordSchema,
});
export {GroupTimeline};

const baseSchemas = [ AoEConeSchema, AoEDonutSchema, AoECircleSchema] as const;
type BasesInputType = z.input<z.ZodUnion<typeof baseSchemas>>;
type BasesOutputType = z.output<z.ZodUnion<typeof baseSchemas>>;


type FullInputType = BasesInputType | (z.input<typeof baseGroupSchema> & {"children": FullInputType[]});
type FullOutputType = BasesOutputType | (z.output<typeof baseGroupSchema> & {"children": FullOutputType[]});

export const PartSchema: z.ZodType<FullOutputType, z.ZodTypeDef, FullInputType> & {
  readonly discriminator: "type",
  readonly optionsMap: Map<Primitive, z.ZodDiscriminatedUnionOption<never>> 
} = z.discriminatedUnion(
  "type",
  [
    baseGroupSchema.extend({
      children: z.lazy(() => PartSchema.array())
    }),
    ...baseSchemas
  ]
);

export type Part = z.infer<typeof PartSchema>;
export type PartTypeName = Part["type"];
export type SpecificPart<T extends PartTypeName> = Extract<Part, {type: T}>;
export type GroupPart = Extract<Part, {type: "group"}>


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

export const LayerSchema = z.object({
  id: z.string(),
  type: z.literal("layer"),
  name: z.string(),
  children: PartSchema.array(),
  visible: z.boolean(),
});
export type Layer = z.infer<typeof LayerSchema>;

export const ArenaSchema = z.object({
  layers: LayerSchema.array()
});
export type Arena = z.infer<typeof ArenaSchema>;

export const PageSchema = z.object({
  notes: z.string(),
  title: z.string(),
  arenas: z.union([
    ArenaSchema.array().length(1),
    ArenaSchema.array().length(2),
    ArenaSchema.array().length(4),
    ArenaSchema.array().length(6),
    ArenaSchema.array().length(8)
  ])
});
export type Page = z.infer<typeof PageSchema>;

export const PlanSchema = z.object({
  version: z.literal(1),
  zone: ZoneSchema,
  pages: PageSchema.array().min(1),
});

export type Plan = z.infer<typeof PlanSchema>;
