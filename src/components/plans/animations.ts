import log from "loglevel";
import { AnyPart, Blueprints, BPProperties, PartProperty, PartType } from "./schemas"
import { ZodDefault, ZodNullable, ZodNumber, ZodObject, ZodOptional, ZodRawShape, ZodTransformer, ZodType, ZodTypeAny } from "zod";
import { assert } from "console";

// expands object types one level deep
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

// expands object types recursively
type ExpandRecursively<T> = T extends object
  ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
  : T;

type UnionToIntersection<U> = 
  (U extends any ? (x: U)=>void : never) extends ((x: infer I)=>void) ? I : never


export type MarkerPart = Extract<AnyPart, {type: Exclude<PartType, "group">}>

export type Change<in out T extends MarkerPart = MarkerPart> = {
  [k in keyof T as k extends "id"|"type" ? never : k]?:
    {
      newValue: T[k],
      lerp: boolean
    }
}

export type Keyframe<in out T extends MarkerPart = MarkerPart> ={
  frame: number,
  changes: Change<T>
}
export type Timeline<in out T extends MarkerPart = MarkerPart> ={
  type: "timeline",
  part: T,
  keyframes: Keyframe<T>[]
};

export type CastAnimation<in out T extends MarkerPart = MarkerPart> = {
  type: "cast",
  frame: number,
  castTime: number,
  fadeTime: number,
  marker: Omit<T, "colour" | "opacity">
};

export const CastColour = {
  r: 255,
  g: 0,
  b: 0
};
export const OmenColour = {
  r: 255,
  g: 127,
  b: 0
}

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
export function lerp<T>(from: T, to: T, at: number, type: ZodType<T, any, T>): T {
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

/**
 * Turn a pre-set Cast Animation into a Timeline of keyframes.
 * @param cast The cast animation
 * @returns The cast as manual timeline keyframes
 */
export function castTimeline(cast: CastAnimation): Timeline {
  const omenFrames = [
    {
      frame: cast.frame - cast.castTime,
      changes: {
        color: {
          newValue: OmenColour,
          lerp: false
        },
        opacity: {
          newValue: 0,
          lerp: false
        },
      },
    },
    {
      frame: cast.frame-1,
      changes: {
        opacity: {
          newValue: 0.7,
          lerp: true
        }
      }
    }
  ];
  const keyframes: Keyframe[] = [
    ...(cast.castTime > 0 ? omenFrames : []),
    {
      frame: cast.frame,
      changes: {
        opacity: {
          newValue: 1,
          lerp: false
        },
        colour: {
          newValue: CastColour,
          lerp: false
        }
      }
    },
    {
      frame: cast.frame + cast.fadeTime,
      changes: {
        opacity: {
          newValue: 0,
          lerp: true
        }
      }
    }
  ] as const;
  return {
    type: "timeline",
    part: {
      ...cast.marker,
      colour: {
        r: 255,
        g: 128,
        b: 0
      },
      opacity: 0
    },
    keyframes
  } as Timeline;
}

function lerpProp(prop: PartProperty<keyof typeof Blueprints, keyof typeof Blueprints[keyof typeof Blueprints]>, frame: number, timeline: Timeline) {
  const propName = prop.name as keyof Change;
  const keyframes = timeline.keyframes.toSorted((a, b) => a.frame - b.frame);
  const propKeyframes = keyframes.filter(kf => Object.hasOwn(kf.changes, propName) && kf.changes[propName] !== undefined);
  // If there are no animations on this property, nothing to do
  if(propKeyframes.length === 0) return undefined;
  // Find the next keyframe that animates this property
  const afterIdx = propKeyframes.findIndex(kf => kf.frame > frame);
  // No changes to this prop, so return the last set value
  if(afterIdx === -1) return propKeyframes[propKeyframes.length - 1].changes[propName]?.newValue;
  // Otherwise, we may need to interpolate it
  const after = propKeyframes[afterIdx];
  const before = afterIdx > 0 ?
    {
      frame: propKeyframes[afterIdx - 1].frame,
      newValue: propKeyframes[afterIdx - 1].changes[propName]?.newValue!
    }
    :
    {
      frame: 0,
      newValue: timeline.part[propName]
    };
  // Un-lerpable property, or set to not lerp, so return previous value
  if(after.changes[propName]?.lerp === false || !prop.type.lerp) return before.newValue;
  const newValue = prop.type.lerp(
    before.newValue as any,
    after.changes[propName]?.newValue as any,
    (frame - before.frame) / (after.frame - before.frame)
  );
  log.debug("Setting new value for", propName, "to", newValue, "by lerping between", before, "and", after, "at frame", frame);
  return newValue;
}  

export function timelineAt(timeline: Timeline, frame: number): MarkerPart {
  // All the properties on this type of part
  const propList = BPProperties[timeline.part.type];
  // // The last value assigned to each property by a keyframe, include frame
  // // number, so we can lerp over them. Populate it with the starting part data
  // // as if it were a keyframe at frame 0.
  // const lastFixed: Record<string, {frame: number, value: unknown}> = Object.fromEntries(
  //   Object.entries(timeline.part).map(([prop, value]) => (
  //     [
  //       prop,
  //       {
  //         frame: 0,
  //         value
  //       }
  //     ]
  //   ))
  // );
  // // All the properties that were modified by a keyframe
  // const changes: {
  //   -readonly [k in keyof MarkerPart]?: MarkerPart[k]
  // } = {};
  // log.debug("Calculating property values at frame", frame);
  // // Iterate over all the keyframes, working out their effects
  // for(const k of timeline.keyframes.toSorted((a, b) => a.frame-b.frame)) {
  //   log.debug("Checking keyframe", k);
  //   for(const prop of propList) {
  //     // FIXME: typing bollocks
  //     const propName = prop.name as Exclude<keyof Change, "id"|"type">;
  //     const change = k.changes[propName];
  //     if(change !== undefined) {
  //       if(k.frame <= frame) {
  //         // Any keyframes prior to this one just set their final value
  //         log.debug("Updating previous value of property", propName, "to", k.changes[propName]?.newValue);
  //         lastFixed[propName] = {
  //           frame: k.frame,
  //           value: k.changes[propName]?.newValue
  //         }
  //       } else {
  //         // Now we're in the future, we only apply changes to properties that
  //         // haven't been written by a previous keyframe
  //         if(changes[propName] !== undefined) continue;
  //         // FIXME: The typing here is shot so turn off linting for a bit...
  //         /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
  //         if(prop.type.lerp === null || change.lerp === false || !Object.hasOwn(lastFixed, propName)) {
  //           const prevValue = lastFixed[propName]?.value ?? undefined;
  //           log.debug("Next change of property", propName, "is un-lerped so using last value", prevValue);
  //           // If lastFixed doesn't have any values this will set set
  //           // 'undefined', which will then fail the hasOwn check above
  //           changes[propName] = prevValue as any;
  //         } else {
  //           const from = lastFixed[propName];
  //           const newValue = prop.type.lerp(
  //             from.value as any,
  //             change.newValue as any,
  //             (frame - from.frame) / (k.frame - from.frame)
  //           ) as any;
  //           log.debug("Setting new value for", propName, "to", newValue, "by lerping between", from, "and",{frame: k.frame, newValue: change.newValue}, "at frame", frame);
  //           changes[propName] = newValue;
  //         }
  //         /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
  //       }
  //     }
  //   }
  // }
  

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-non-null-asserted-optional-chain, @typescript-eslint/no-non-null-assertion */
  const changes = Object.fromEntries(
    propList.map(
      prop => ([prop.name, lerpProp(prop, frame, timeline)])
    ).filter(([_, value]) => value !== undefined)
  );
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-non-null-asserted-optional-chain, @typescript-eslint/no-non-null-assertion */
  
  // Finally, return the initial part with all changes overlaid onto it
  const final = Object.assign({}, timeline.part, changes);
  log.debug("Final result is", final);
  return final;
}