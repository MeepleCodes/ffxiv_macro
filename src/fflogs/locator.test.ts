import { suite, expect, test } from "vitest";
import { findInsertionPoint, Locator } from "./locator";


function intComp(a: number, b: number) {
  return a-b;
}



suite("findInsertionPoint", () => {
  test("empty array should insert at 0", () => {
    expect(findInsertionPoint([], 1, intComp)).toBe(0)
  });
  test("below first entry should insert at 0", () => {
    expect(findInsertionPoint([10, 11, 12, 13], 1, intComp)).toBe(0)
  });
  test("above last entry should be .length", () => {
    expect(
      findInsertionPoint([1, 2, 3, 4], 10, intComp)
    ).toBe(4)
  });
  test("simple insertion", () => {
    expect(
      findInsertionPoint([10, 20, 30], 15, intComp)
    ).toBe(1)
  });
  test("equal to first entry should be after it", () => {
    expect(findInsertionPoint([1, 2, 3, 4], 1, intComp)).toBe(1)
  });
  test("equal to first entry run should be after the run", () => {
    expect(findInsertionPoint([1, 1, 1, 4], 1, intComp)).toBe(3)
  });
  test("equal to last entry should be length", () => {
    expect(findInsertionPoint([0, 1, 1, 1], 1, intComp)).toBe(4)
  });
  test("equal to duplicate entries should use last", () => {
    expect(findInsertionPoint([0, 1, 1, 1, 2, 3], 1, intComp)).toBe(4)
  });
});

const locator = new Locator([
  {timestamp: 1000, sourceID: 10,  sourceResources: {x: 0,   y: 0,   facing: 0}},
  {timestamp: 2000, targetID: 10,  targetResources: {x: 100, y: 0,   facing: 1}},
  {timestamp: 3000, sourceID: 10,  sourceResources: {x: 200, y: 0,   facing: 2}},
  {timestamp: 1000, sourceID: 20,  sourceResources: {x: 999, y: 999, facing: 100}},
  {timestamp: 2000, targetID: 30,  targetResources: {x: 999, y: 999, facing: 100}},
  {timestamp: 3000, sourceID: 40,  sourceResources: {x: 999, y: 999, facing: 100}},    
]);

suite.each([
  {mode: "direct", locator: locator},
  {mode: "reloaded", locator: new Locator(locator.toJson())}
])("Locator ($mode)", ({locator}) => {
  test("knows about expected actors"), () => {
    expect(locator.knownActorIDs()).toBe([10, 20, 30]);
  }
  test("unmatched actor returns null", () => {
    expect(locator.estimateLocation(2, 1000)).toBeNull()
  });
  test("without lerp returns closest", () => {
    expect(locator.estimateLocation(10, 1100)).toMatchObject({
      x: 0, y: 0, facing: 0, age: 100, lerped: false
    })
  });
  test("lerp in middle returns average", () => {
    expect(locator.estimateLocation(10, 1500, true)).toMatchObject({
      x: 50, y: 0, facing: 0.5, lerped: true
    })
  });
  test("near lerp returns biased values", () => {
    expect(locator.estimateLocation(10, 1100, true)).toMatchObject({
      x: 10, y: 0, facing: 0.1, age: 100, lerped: true
    })
  });
  test("lerp off end returns unlerped", () => {
    expect(locator.estimateLocation(10, 3100, true)).toMatchObject({
      x: 200, y: 0, facing: 2, age: 100, lerped: false
    })
  });

})
