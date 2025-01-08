import { suite, expect, test } from "vitest";
import { gameToCanvasRotation, logToCanvasRotation, logToGameRotation } from "./position";

const GAME = {
  NORTH: Math.PI * 3/2,
  EAST: 0,
  SOUTH: Math.PI / 2,
  WEST: Math.PI
} as const;

const LOGS = {
  NORTH: -786,
  WEST:  -315,
  EAST: -628,
  SOUTH: -472
} as const;

const CANVAS = {
  NORTH: 270,
  SOUTH: 90,
  EAST: 0,
  WEST: 180
} as const;

suite("rotation tests", () => {
  test("fflog facings convert to game facings", () => {
    expect(logToGameRotation(LOGS.NORTH)).toBeCloseTo(GAME.NORTH, 1);
    expect(logToGameRotation(LOGS.SOUTH)).toBeCloseTo(GAME.SOUTH, 1);
    expect(logToGameRotation(LOGS.EAST )).toBeCloseTo(GAME.EAST , 1);
    expect(logToGameRotation(LOGS.WEST )).toBeCloseTo(GAME.WEST , 1);
  });
  test("game facings convert to canvas facings", () => {
    expect(gameToCanvasRotation(GAME.NORTH)).toBeCloseTo(CANVAS.NORTH);
    expect(gameToCanvasRotation(GAME.SOUTH)).toBeCloseTo(CANVAS.SOUTH);
    expect(gameToCanvasRotation(GAME.EAST )).toBeCloseTo(CANVAS.EAST );
    expect(gameToCanvasRotation(GAME.WEST )).toBeCloseTo(CANVAS.WEST );
  });
  test("fflog facings convert to canvas facings", () => {
    expect(logToCanvasRotation(LOGS.NORTH)).toBeCloseTo(CANVAS.NORTH, 0);
    expect(logToCanvasRotation(LOGS.SOUTH)).toBeCloseTo(CANVAS.SOUTH, 0);
    expect(logToCanvasRotation(LOGS.EAST )).toBeCloseTo(CANVAS.EAST , 0);
    expect(logToCanvasRotation(LOGS.WEST )).toBeCloseTo(CANVAS.WEST , 0);
  });  
});