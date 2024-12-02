/**
 * Geometry transformation functions.
 *
 * We have to deal with three different coordinate systems here:
 * - Game data (from XIVAPI or loaded client data files) 
 * - FFLogs data (from fetched reports)
 * - The canvas we're drawing on, which is scaled to match raidplain.io's
 *   background images
 *
 * ## Game space
 * Units are yalms. The centre of the arena always seems to be 100,100. 0,0 is
 * the north-west corner of the map.
 *
 * ## FFLogs Space
 * Units are "centi-yalms" (integer values, 100 = 1.00 yalms). The arena centre
 * is the same as for the game. Angles are measured in centi-rads (integer
 * values, 100 = 1.00 rad) clockwise from directly east but the range seems to
 * be -2PI to 0 for whatever reason.
 *
 * ## Canvas Space
 * Units are pixels, the arena centre is 0,0. 22.5 pixels is one yalm. Angles
 * are measured clockwise from south (which means you need to draw a line from
 * x,y to x,y+n to have it face along a given angle after applying a rotation).
 */

export type Position = {
  x: number;
  y: number;
}

/**
 * Convert a single axis coordinate (x or y) from FFLogs Space to Canvas Space
 * @param pos x or y position
 * @returns corresponding pixel position
 */
export function logToCanvasCoord(pos: number): number {
  return ((pos / 100.0) - 100.0) * 22.5;
}

/**
 * Convert a coordinate (x and y) from FFLogs Space to Canvas Space
 * @param position x,y coordinate 
 * @returns corresponding pixel coordinate pair
 */
export function logToCanvas(position: {x: number, y: number}): {x: number, y: number} {
  return {
    x: logToCanvasCoord(position.x),
    y: logToCanvasCoord(position.y)
  }
}

export function logToGameCoord(pos: number): number {
  return pos / 100;
}

export function logToGame(position: Position): Position {
  return {
    x: logToGameCoord(position.x),
    y: logToGameCoord(position.y)
  }
}

export function logToHumanRotation(facing: number): number {
  return (logToCanvasRotation(facing) + 180) % 360;
}

/**
 * Convert a facing from FFLogs Space to Canvas Space
 * @param facing fflogs facing
 * @returns Canvas rotation
 */
export function logToCanvasRotation(facing: number): number {
  return ((((facing/100.0) * 180 / Math.PI) - 90 + 360) % 360);
}

/**
 * Convert a distance from Game Space to Canvas Space
 * @param dist Distance in game units (yalms)
 * @returns Distance in pixels
 */
export function gameToCanvasDist(dist: number): number {
  return dist * 22.5;
}

/**
 * Convert a location from Game Space to Canvas Space
 * @param loc X or Z coordinate in game space
 * @returns Pixel coordinate in canvas space
 */
export function gameToCanvas(loc: number): number {
  return (loc-100) * 22.5;
}

/**
 * Convert a location from Canvas Space to Game Space
 * @param loc X or y pixel coordinate in canvas space
 * @returns Yalm coordinate in game space
 */
export function canvasToGame(loc: number): number {
  return (loc/22.5) + 100;
}