import { KonvaNodeEvents } from "react-konva";

export type AoEProps = {
  colour?: Colour,
  opacity?: number
  x?: number,
  y?: number,
} & KonvaNodeEvents;

/**
 * Get the remaining props from a Konva shape that can be exposed without
 * clashing with an AoE marker's props.
 */
export type AoEOmitShapeProps<T, K extends keyof T = never> = 
  Omit<T, K | "x"|"y"|"fill">;

export type Colour = {
  r: number;
  g: number;
  b: number;
};
export type Position = {
  x: number;
  y: number;
}

export function colourToRGBA(colour?: Colour, opacity?: number) {
  return `rgba(${colour?.r ?? 255}, ${colour?.g ?? 0}, ${colour?.b ?? 0}, ${opacity ?? 0.8})`;
}