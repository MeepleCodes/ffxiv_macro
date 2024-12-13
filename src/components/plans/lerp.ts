import { ZodDefault, ZodNumber, ZodObject, ZodRawShape, ZodTransformer, ZodType, ZodTypeAny } from "zod";


/**
 * Remove wrapping types from a Zod type to get the underlying type.
 * 
 * Anything we don't want to handle isn't remove (currently nullable/optional)
 * 
 * @param type A ZodType that may be wrapped
 * @returns The base type
 */
function zodBase(type: ZodTypeAny): ZodTypeAny {
  if(type instanceof ZodDefault) return zodBase(type.removeDefault() as ZodTypeAny);
  if(type instanceof ZodTransformer) return zodBase(type.sourceType() as ZodTypeAny);
  // For now, don't want to try handling lerping undef/null
  // if(type instanceof ZodOptional || type instanceof ZodNullable) return type.unwrap() as ZodTypeAny;
  return type;
}

/**
 * Coerce a value to match the conditions of its zod type, e.g. rounding to
 * steps or int-only.
 * 
 * Currently ignores min/max/finite because lerp shouldn't break those.
 * 
 * @param value Value to check
 * @param type ZodNumber type
 * @returns A number that passes the checks of `type`
 */
function coerceZodNumber(value: number, type: ZodNumber): number {
  let out = value;
  for(const check of type._def.checks) {
    switch(check.kind) {
      case "multipleOf": {
        out = Math.round(out / check.value) * check.value;
        break;
      }
      case "int": {
        out = Math.round(out);
        break;
      }
    }
  }
  return out;
}

/**
 * Determine if we can lerp a value of this Zod type.
 * 
 * @param type The ZodType of the value
 * @returns Whether we know how to lerp between two values of this type
 */
export function canLerp(type: ZodTypeAny): boolean {
  type = zodBase(type);
  if(type instanceof ZodNumber) return true;
  if(type instanceof ZodObject) {
    for(const key of Object.keys(type.shape as ZodRawShape)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const child = type.shape[key];
      if(child instanceof ZodType && !canLerp(child)) return false;
    }
    return true;
  }
  return false;
}

function assertIs<T>(val: unknown): asserts val is T {}

/**
 * Lerp between two values of a given Zod type.
 * 
 * Returns the interpolated value, or throws an error if the type isn't lerpable.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lerp<T>(from: T, to: T, at: number, type: ZodType<T, any, unknown>): T {
  const baseType = zodBase(type);
  if(!canLerp(type)) throw Error(`Unlerpable type ${type._def}`);
  
  if(baseType instanceof ZodNumber) {
    // Typescript can't infer this to mean T is a number, so just tell it
    assertIs<number>(to);
    assertIs<number>(from);
    // Use type.parse to ensure we apply any step() filters and as a last-minute
    // check for problems.
    return coerceZodNumber(((to - from) * at) + from, baseType) as T;

  } else if(baseType instanceof ZodObject) {
    const out: T = {} as T;
    for(const key of Object.keys(baseType.shape as ZodRawShape)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const property = baseType.shape[key];
      if(property instanceof ZodType) {
        assertIs<keyof T>(key);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        out[key] = lerp(from[key], to[key], at, property);
      }
    }
    return out;
  }
  throw Error(`Failed to lerp type ${type._def} (${baseType._def})`)
}
