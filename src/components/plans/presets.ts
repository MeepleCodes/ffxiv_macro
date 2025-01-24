import { Colour } from "../drawing/types";

export const ColourPresets = {
  "Red": {r: 255, g: 0, b: 0}
} as const satisfies Record<string, Colour>;