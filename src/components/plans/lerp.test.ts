/**
 * Tests for the animation code
 */

import { suite, expect, test } from "vitest";
import { canLerp as canLerp, lerp } from "./lerp";
import { z } from "zod";

suite("canLerp tests", () => {
  test("can lerp a number", () => {
    expect(canLerp(z.number())).toBe(true);
  });
  test("can't lerp a string", () => {
    expect(canLerp(z.string())).toBe(false);
  });
  test("can lerp a default number", () => {
    expect(canLerp(z.number().default(10))).toBe(true);
  });
  test("can't lerp an optional number", () => {
    expect(canLerp(z.number().optional())).toBe(false);
  });
  test("can't lerp a nullable number", () => {
    expect(canLerp(z.number().nullable())).toBe(false);
  });
  test("can lerp a number with a step", () => {
    expect(canLerp(z.number().step(0.1))).toBe(true);
  });
  test("can lerp an object containing a number", () => {
    expect(canLerp(z.object({number: z.number()}))).toBe(true);
  });
  test("can't lerp an object containing a number and a string", () => {
    expect(canLerp(z.object({
      number: z.number(),
      string: z.string()
    }))).toBe(false);
  });
  test("can lerp an nested object containing only numbers", () => {
    expect(canLerp(z.object({
      inner: z.object({
        number: z.number()
      })
    }))).toBe(true);
  });
});
suite("lerp tests", () => {
  test("lerping (0, 100) to 0.5 gives 50", () => {
    expect(lerp(0, 100, 0.5, z.number())).toBe(50);
  });
  test("lerping (0, 100) to 0.0 gives 0", () => {
    expect(lerp(0, 100, 0.0, z.number())).toBe(0);
  });
  test("lerping (0, 100) to 1.0 gives 100", () => {
    expect(lerp(0, 100, 1, z.number())).toBe(100);
  });
  test("lerping (2, 3) to 0.1 gives 2.1", () => {
    expect(lerp(2, 3, 0.1, z.number())).toBe(2.1);
  });
  test("lerping an object with a single field works", () => {
    expect(lerp({value: 1}, {value: 2}, 0.5, z.object({value: z.number()}))).toStrictEqual({value: 1.5})
  });
  test("lerping an object with multiple fields lerps them individually", () => {
    expect(lerp(
      {a: 1, b: 100},
      {a: 2, b: 200},
      0.5,
      z.object(
        {a: z.number(), b: z.number()}
      )
    )).toStrictEqual({a: 1.5, b: 150})
  });
  test("lerping nested objects works", () => {
    const lerped = lerp(
      {a: 1, inner: {x: 100, y: 1000, z: 0.1}},
      {a: 2, inner: {x: 200, y: 2000, z: 0.2}},
      0.5,
      z.object({
        a: z.number(),
        inner: z.object({
          x: z.number(),
          y: z.number(),
          z: z.number().step(0.01)
        })
      })
    );

    expect(lerped).toStrictEqual({
      a: 1.5,
      inner: {
        x: 150,
        y: 1500,
        z: 0.15
      }
    });
  });
});