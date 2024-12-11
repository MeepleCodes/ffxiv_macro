import { objectInputType, objectOutputType, UnknownKeysParam, z, ZodLiteral, ZodObject, ZodString, ZodTypeAny } from 'zod';
import { AngleType, DistanceType, FacingType, LocationType, PartListType, PropType } from './types';


type SchemaBaseShape<T extends string> = {
  id: ZodString,
  type: ZodLiteral<T>
}

// export type PartConfig = z.infer<Schema>
export type SchemaShape = Record<string, PropType>;

export type Schema<
  Shape extends SchemaShape,
  Type extends string
> = ZodObject<
  Shape & SchemaBaseShape<Type>,
  UnknownKeysParam,
  ZodTypeAny,
  objectOutputType<Shape & SchemaBaseShape<Type>, ZodTypeAny>,
  objectInputType<Shape & SchemaBaseShape<Type>, ZodTypeAny>
>;


function makeSchema<Shape extends SchemaShape, Type extends string>(typeName: Type, shape: Shape): Schema<Shape, Type> {
  return z.object(Object.assign({type: z.literal(typeName), id: z.string()}, shape));
}



export const PartSchema = z.discriminatedUnion("type", [
  makeSchema("aoecone", {
    location: LocationType,
    facing: FacingType,
    angle: AngleType,
    range: DistanceType
  }),
  makeSchema("aoedonut", {
    location: LocationType,
    facing: FacingType,
    innerRadius: DistanceType,
    outerRadius: DistanceType
  }),
  makeSchema("aoecircle", {
    location: LocationType,
    facing: FacingType,
    radius: DistanceType,
  }),
  makeSchema("group", {
    elements: PartListType
  })
]);

export type AnyPart = z.infer<typeof PartSchema.options[number]>;
export type SchemaTypeName = AnyPart["type"];
export type Part<T extends SchemaTypeName> = Extract<AnyPart, {type: T}>;
export const [AoEConeSchema, AoECircleSchema, AoEDonutSchema, GroupSchema] = PartSchema.options;

// export {Schemas};