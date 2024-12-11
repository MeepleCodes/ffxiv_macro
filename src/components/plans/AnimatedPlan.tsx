import React from "react";
import { AnyPart, Blueprints, PartType } from "./schemas"
import { Zone } from "./zones"
import { time } from "console";

type Part<T extends PartType> = Extract<AnyPart, {type: T}>;

// expands object types one level deep
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

// expands object types recursively
type ExpandRecursively<T> = T extends object
  ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
  : T;



type MarkerPart = Extract<AnyPart, {type: Exclude<PartType, "group">}>

export type Change<in out T extends MarkerPart = MarkerPart> = {
  [k in keyof T as k extends "id"|"type" ? never : k]?:
    {
      newValue: T[k],
      lerp: boolean
    }
}

type LastValue<in out T extends MarkerPart = MarkerPart> = {
  -readonly [k in keyof T as k extends "id"|"type" ? never : k]?:
    {
      frame: number,
      value: T[k]
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
  marker: T
};


export type AnimatedPlanConfig = {
  arena: Zone,
  frames: number,
  parts: (Timeline|CastAnimation)[]
}

export type AnimatedPlanProps = {
  config: AnimatedPlanConfig
}


function castTimeline(cast: CastAnimation): Timeline {
  const omenFrames = [
    {
      frame: cast.frame - cast.castTime,
      changes: {
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
          newValue: 0.9,
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
        colour: {
          newValue: {
            r: 255,
            g: 0,
            b: 0
          },
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
  };
}

// function timelineAt<T extends MarkerPart>(timeline: Timeline<T>, frame: number): T {
//   // FIXME: Once I've wrapped my head around specialisation-of-union typing, remove the cast
//   const basePart = {id: timeline.id, ...timeline.part} as T;
//   const lastFixed: LastValue<T> = {};
//   for(const k of timeline.keyframes.toSorted((a, b) => b.frame-a.frame)) {
//     if(k.frame <= frame) {
//       Object.entries(k.changes).forEach(([prop, value]) => {
//         if(value === undefined) return;
//         // More fixmes...
//         lastFixed[prop as keyof LastValue<T>] = {
//           frame: k.frame,
//           value: value as T[keyof T]
//         } as LastValue<T>[keyof LastValue<T>];
//         basePart[prop as keyof T] = value as T[keyof T];
//       });
//     }
//   }
//   return basePart;
// }

function timelineAt<T extends MarkerPart>(timeline: Timeline<T>, frame: number): MarkerPart {
  // FIXME: Once I've wrapped my head around specialisation-of-union typing, remove the cast
  // TODO: This needs to iterate over the actual props of Part[timeline.part.type]
  const basePart: T = timeline.part;
  const lastFixed: LastValue = {};
  for(const k of timeline.keyframes.toSorted((a, b) => b.frame-a.frame)) {
    if(k.frame <= frame) {
      
      for(const prop of Object.getOwnPropertyNames(Blueprints[timeline.part.type])) {
        // More fixmes...
        const value = k.changes[prop]?.newValue;
        if(value !== undefined) {
          lastFixed[prop as keyof LastValue] = {frame: k.frame, value};
          basePart[prop as keyof MarkerPart] = value;
        }
      }
    }
  }
  return basePart;
}

export default function AnimatedPlan(props: AnimatedPlanProps) {
  const timelines = React.useMemo(() => {
    return props.config.parts.map(part => part.type === "timeline" ? part : castTimeline(part))
  }, [props.config.parts]);

}