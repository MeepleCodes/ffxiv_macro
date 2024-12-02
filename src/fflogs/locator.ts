type TimedLocation = {
  x: number;
  y: number;
  facing: number;
  timestamp: number;
  alive: boolean;
}

export function findInsertionPoint<ArrayType, MatchType = ArrayType>(array: ArrayType[], value: MatchType, comparator: (a: ArrayType, b: MatchType) => number): number {
  // First, check if the array is empty or we're before the start
  if(array.length <= 0 || comparator(array[0], value) > 0) return 0;
  // Binary chop to find the last index that is below value
  let left=0, right=array.length-1;
  while(left <= right) {
    const mid = Math.floor((left + right) / 2);
    const aboveMid = comparator(array[mid], value) <= 0;
    const belowNext = (mid >= (array.length-1)) || comparator(array[mid+1], value) > 0;
    if(aboveMid && belowNext) {
      return mid + 1;
    } else if(aboveMid) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return array.length;
}
export interface ResourcesBase {
    x: number;
    y: number;
    facing: number;
    hitPoints: number;
}  

export interface EventBase {
  timestamp: number;
  sourceID?: number;
  sourceResources?: ResourcesBase;
  targetID?: number;
  targetResources?: ResourcesBase;
}

/**
 * The results of getting the location of an actor at a timestamp
 */
export interface LocationMatch {
  /** X coordinate, in 0.01 yalms */
  x: number;
  /** Y coordinate, in 0.01 yalms */
  y: number;
  /** Facing, in 0.01 rad CW from east */
  facing: number;
  /** Whether the actor had any HP */
  alive: boolean;
  /** Time in ms between the requested timestamp and the closest known location. Positive if the closest location was in the past, negative if it's in the future */
  age: number;
  /** Whether this result was lerped between two timestamps, or is just the closest match */
  lerped: boolean;
}

export type LocationSaveData = {
  actorID: number;
  locations: TimedLocation[];
}[];

export class Locator {
  private $locations: TimedLocation[][] = [];

  public constructor() {}
  public static fromJSON(json: string): Locator {
    const saveData = JSON.parse(json) as LocationSaveData;
    return Locator.fromSaveData(saveData);
  }
  public static fromSaveData(saveData: LocationSaveData): Locator {
    const locator = new Locator();
    saveData.forEach(data => locator.$locations[data.actorID] = data.locations);
    return locator;
  }
  public static fromEvents(events: EventBase[]): Locator {
    const locator = new Locator();

    events.forEach(event => {locator.addEvent(event)});

    return locator;
  }
  public addEvent(event: EventBase) {
    if(event.sourceID !== undefined && event.sourceResources !== undefined) {
      this.addEventLocation(event.sourceID, event.timestamp, event.sourceResources);
    }
    if(event.targetID !== undefined && event.targetResources !== undefined) {
      this.addEventLocation(event.targetID, event.timestamp, event.targetResources);
    }
  }
  private addEventLocation(actorID: number, timestamp: number, resources: ResourcesBase) {
    if(this.$locations.at(actorID) === undefined) this.$locations[actorID] = [];
    // Extract only the fields we want
    const {x, y, facing} = resources;
    const alive = resources.hitPoints > 0;
    // Find where it should be in the array (*should* always be end but may as well check)
    const firstAfterIdx = findInsertionPoint(this.$locations[actorID], timestamp, (a, b) => a.timestamp - b);
    // Don't bother inserting duplicates
    if(firstAfterIdx === 0 || this.$locations[actorID][firstAfterIdx-1].timestamp != timestamp) {
      this.$locations[actorID].splice(firstAfterIdx, 0, {timestamp, x, y, facing, alive});
    }
  }

  public closestLocations(actorID: number, timestamp: number): [TimedLocation, TimedLocation?] | null {
    const locs = this.$locations.at(actorID);
    if(locs === undefined) return null;
    const firstAfterIdx = findInsertionPoint(locs, timestamp, (a, b) => a.timestamp - b);
    if(firstAfterIdx === 0) {
      return [locs[0]]
    } else if(firstAfterIdx >= locs.length) {
      return [locs[locs.length-1]];
    } else {
      return [locs[firstAfterIdx-1], locs[firstAfterIdx]];
    }
  }
  public estimateLocation(actorID: number, timestamp: number, lerp = false): LocationMatch|null {
    const locs = this.closestLocations(actorID, timestamp);
    if(locs === null) return null;
    if(lerp && locs[1] !== undefined && locs[0].alive) { // Dead players don't lerp
      const alpha = (timestamp - locs[0].timestamp) / (locs[1].timestamp - locs[0].timestamp);
      return {
        x: locs[0].x * (1-alpha) + locs[1].x * alpha,
        y: locs[0].y * (1-alpha) + locs[1].y * alpha,
        facing: locs[0].facing * (1-alpha) + locs[1].facing * alpha,
        age: timestamp - (Math.abs(timestamp - locs[0].timestamp) < Math.abs(timestamp - locs[1].timestamp) ? locs[0] : locs[1]).timestamp,
        lerped: true,
        // We can't interpolate "is alive" so use previous state unless we're at the second timestamp
        alive: locs[1].timestamp === timestamp ? locs[1].alive : locs[0].alive
      }
    } else {
      const best = 
        locs[1] === undefined || 
        Math.abs(timestamp - locs[0].timestamp) < Math.abs(timestamp - locs[1].timestamp)
          ? locs[0]
          : locs[1];
      return {
        ...best,
        age: timestamp - best.timestamp,
        lerped: false
      };
    }
  }
  public toJson(space?: string | number) {
    return JSON.stringify(this.getJsonData(), null, space);
  }
  public getJsonData(): LocationSaveData {
    const saveData: LocationSaveData = [];
    this.$locations.forEach((locations, actorID) => saveData.push({actorID, locations}));
    return saveData;
  }
  public knownActorIDs() {
    return this.$locations.map((_, index) => index);
  }

}

