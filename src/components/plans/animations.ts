import { CastAnimation, Part, Timeline, TimelineSchema } from "./schemas"
import { invariant } from "@tanstack/react-router";
import { canLerp, lerp } from "./lerp";
import {getLogger, levels} from "loglevel";

const log = getLogger("animations");
log.setLevel(levels.INFO);

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

// // expands object types one level deep
// type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

// // expands object types recursively
// type ExpandRecursively<T> = T extends object
//   ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
//   : T;

// type UnionToIntersection<U> = 
//   (U extends any ? (x: U)=>void : never) extends ((x: infer I)=>void) ? I : never


// type CastPartType = CastAnimation["part"]["type"]
// type CastTypes = {
//   [key in CastPartType]: CastAnimation & {part: {type: key}}
// };
// type TimelinePartTypes = Timeline["part"]["type"];
// type TimelineTypes = {
//   [key in TimelinePartTypes]: Timeline & {part: {type: key}}
// }


/**
 * Turn a pre-set Cast Animation into a Timeline of keyframes.
 * @param cast The cast animation
 * @returns The cast as manual timeline keyframes
 */
export function castTimeline(cast: CastAnimation): Timeline {
  const omenFrames = [
    {
      frame: cast.castFrame - cast.omenFrames,
      changes: {
        colour: {
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
      frame: cast.castFrame-1,
      changes: {
        opacity: {
          newValue: 0.7,
          lerp: true
        }
      }
    }
  ];
  const keyframes = [
    ...(cast.omenFrames > 0 ? omenFrames : []),
    {
      frame: cast.castFrame,
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
      frame: cast.castFrame + cast.fadeFrames,
      changes: {
        opacity: {
          newValue: 0,
          lerp: true
        }
      }
    }
  ];
  
  const part: Part = {
    ...cast.part,
    colour: CastColour,
    opacity: 0
  };
  // FIXME: Still can't *quite* get the types to match up :(
  return {
    id: cast.id,
    type: "timeline",
    part,
    keyframes
  } as Timeline;
}


type Keyframe = Timeline["keyframes"][number];

export function timelineAt(timeline: Timeline, frame: number): Part {
  const tlSchema = TimelineSchema.options.find(o => o.shape.part.shape.type.value === timeline.part.type);
  invariant(tlSchema !== undefined);
  const props = Object.keys(tlSchema.shape.keyframes.element.shape.changes.shape) as Array<keyof Keyframe["changes"]>;
  // Make sure the keyframes are sorted
  const keyframes = timeline.keyframes.toSorted((a, b) => a.frame - b.frame);
  const output = {...timeline.part};
  log.debug("Calculating properties at frame", frame);
  for(const prop of props) {
    log.debug("Calculating value for prop", prop);
    const schema = tlSchema.shape.part.shape[prop];
    const before = keyframes.findLast(kf => prop in kf.changes && kf.frame <= frame);
    const after = keyframes.find(kf => prop in kf.changes && kf.frame > frame);
    let fromFrame, fromValue;
    if(before === undefined) {
      fromFrame = 0;
      fromValue = timeline.part[prop];
      log.debug("No previous keyframe for this value, using part default", fromValue);
    } else {
      fromFrame = before.frame;
      // TS doesn't know we filtered the array so this is guaranteed to be defined
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      fromValue = before.changes[prop]!.newValue;
      log.debug("Using fromValue of previous keyframe at", fromFrame, "of", fromValue);
    }
    if(after === undefined || after.changes[prop]?.lerp === false || !canLerp(schema)) {
      output[prop] = fromValue;
      log.debug("No to-value or cannot lerp, using from value", fromValue);
    } else {
      // Ditto
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const toValue = after.changes[prop]!.newValue;
      output[prop] = lerp(fromValue, toValue, (frame-fromFrame) / (after.frame - fromFrame), schema);
      log.debug("Lerped between", fromValue, "and", toValue, "to get", output[prop]);
    }
    
  }
  return output as Part;
}