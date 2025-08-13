import { suite, expect, test } from "vitest";
import { findInsertionPoint, LocationSaveData, Locator, TimedLocation } from "./locator";
import { text } from "stream/consumers";


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

suite("locator", () => {
  suite("location trimming", () => {
    const locator = new Locator([
      [1, 0, 0,     0,  0,  0, true],
      [1, 0, 1000,  10, 10, 0, true],
      [1, 0, 2000,  20, 20, 0, true],
      [1, 0, 2100,  21, 21, 0, true],
      [1, 0, 2200,  22, 22, 0, true],
      [1, 0, 2300,  23, 23, 0, true],
    ]);
    const expectedLocations = locator.toSaveData()[0].locations;
    test("locations spaced above resolution should not be trimmed", () => {
      locator.trimLocations(10);
      expect(
        locator.toSaveData()[0].locations
      ).toEqual<TimedLocation[]>(
        expectedLocations
      )
    });
    test("first and last location should never trimmed", () => {
      locator.trimLocations(10000);
      expect(
        locator.toSaveData()[0].locations
      ).toEqual<TimedLocation[]>([
        expectedLocations[0],
        expectedLocations[expectedLocations.length-1]
      ])
    });
    test("multiple locations should be trimmed", () => {
      locator.trimLocations(1000);
      expect(
        locator.toSaveData()[0].locations
      ).toEqual<TimedLocation[]>([
        expectedLocations[0],
        expectedLocations[1],
        expectedLocations[2],
        expectedLocations[5],
      ]);
    });    
  });
  
});

const locator = new Locator([
// actor inst. time.   x    y     facing  alive
  [10,   0,    1000,   0,   0,    0,      true],
  [10,   0,    2000,   100, 0,    1,      true],
  [10,   0,    3000,   200, 0,    2,      true],
  [20,   0,    1000,   999, 999,  100,    true],
  [30,   0,    2000,   999, 999,  100,    true],
  [40,   0,    3000,   999, 999,  100,    true],    
]);

suite.each([
  {mode: "direct", locator: locator},
  {mode: "reloaded", locator: Locator.fromJSON(locator.toJson())}
])("Locator ($mode)", ({locator}) => {
  test("knows about expected actors"), () => {
    expect(locator.knownActorIDs()).toBe([10, 20, 30]);
  }
  test("unmatched actor returns null", () => {
    expect(locator.estimateLocation(2, 0, 1000)).toBeNull()
  });
  test("without lerp returns closest", () => {
    expect(locator.estimateLocation(10, 0, 1100)).toMatchObject({
      x: 0, y: 0, facing: 0, age: 100, lerped: false
    })
  });
  test("lerp in middle returns average", () => {
    expect(locator.estimateLocation(10, 0, 1500, true)).toMatchObject({
      x: 50, y: 0, facing: 0.5, lerped: true
    })
  });
  test("near lerp returns biased values", () => {
    expect(locator.estimateLocation(10, 0, 1100, true)).toMatchObject({
      x: 10, y: 0, facing: 0.1, age: 100, lerped: true
    })
  });
  test("lerp off end returns unlerped", () => {
    expect(locator.estimateLocation(10, 0, 3100, true)).toMatchObject({
      x: 200, y: 0, facing: 2, age: 100, lerped: false
    })
  });

})
