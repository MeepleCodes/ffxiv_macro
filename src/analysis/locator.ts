/**
 * Utility object for interpolating actor locations based on event history.
 */


/**
 * Find the index in an array to insert a new value that will keep the array
 * sorted.
 * @param array Array (should already be sorted)
 * @param value Value to insert
 * @param comparator Comparator between values
 * @returns Index into the array where the new value should be inserted
 */
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

/**
 * The necessary information about a 
 */
export interface ResourcesBase {
    x: number;
    y: number;
    facing: number;
    hitPoints: number;
}  

export interface EventBase {
  timestamp: number;
  sourceID?: number;
  sourceInstance?: number;
  sourceResources?: ResourcesBase;
  targetID?: number;
  targetInstance?: number;
  targetResources?: ResourcesBase;
}

/**
 * The results of getting the location of an actor at a timestamp
 */
export interface LocationMatch {
  /** X coordinate, in yalms */
  x: number;
  /** Y coordinate, in yalms */
  y: number;
  /** Facing, in rad CW from east */
  facing: number;
  /** Whether the actor had any HP */
  alive: boolean;
  /** Time in ms between the requested timestamp and the closest known location. Positive if the closest location was in the past, negative if it's in the future */
  age: number;
  /** Whether this result was lerped between two timestamps, or is just the closest match */
  lerped: boolean;
}


/**
 * Minimal data for the location of an actor at a timestamp
 */
export type TimedLocation = {
  x: number;
  y: number;
  facing: number;
  timestamp: number;
  alive: boolean;
}

/**
 * Save data format for persisting a Locator to storage
 */
export type LocationSaveData = {
  /** Unique actor ID */
  actorID: number;
  /** Instance number of an actor; 0 if there's only one instance of that actor */
  instanceID: number;
  /** Known locations for that actor instance, sorted by time */
  locations: TimedLocation[];
}[];

export class Locator {
  private $locations: TimedLocation[][][] = [];

  public constructor(locations: Parameters<Locator["addKnownLocation"]>[] = []) {
    locations.forEach(location => {this.addKnownLocation(...location)});
  }

  /**
   * Load a locator from JSON saved data
   * @param json Saved data as JSON
   * @returns Loaded Locator object
   */
  public static fromJSON(json: string): Locator {
    const saveData = JSON.parse(json) as LocationSaveData;
    return Locator.fromSaveData(saveData);
  }

  /**
   * Load a locator from parsed save data
   * @param saveData Parsed save data
   * @returns Loaded Locator object
   */
  public static fromSaveData(saveData: LocationSaveData): Locator {
    const locator = new Locator();
    saveData.forEach(data => {
      if(!(data.actorID in locator.$locations)) locator.$locations[data.actorID] = [];
      locator.$locations[data.actorID][data.instanceID] = data.locations
    });
    return locator;
  }

  /**
   * Add a new known location at a given timestamp for an actor instance (e.g.
   * from log data)
   *
   * @param actorID Actor ID
   * @param instanceID Instance ID of that actor, or 0 if there's only one
   * instance
   * @param timestamp Timestamp for this location
   * @param x X coordinate (game space)
   * @param y Y coordinate (game space)
   * @param facing Facing (game space)
   * @param alive Whether they're alive or not
   */
  public addKnownLocation(actorID: number, instanceID: number, timestamp: number, x: number, y: number, facing: number, alive: boolean) {
    if(this.$locations.at(actorID) === undefined) this.$locations[actorID] = [];
    if(!(instanceID in this.$locations[actorID])) this.$locations[actorID][instanceID] = [];
    // Find where it should be in the array (*should* always be end but may as well check)
    const firstAfterIdx = findInsertionPoint(this.$locations[actorID][instanceID], timestamp, (a, b) => a.timestamp - b);
    // Don't bother inserting duplicates
    if(firstAfterIdx === 0 || this.$locations[actorID][instanceID][firstAfterIdx-1].timestamp != timestamp) {
      this.$locations[actorID][instanceID].splice(firstAfterIdx, 0, {timestamp, x, y, facing, alive});
    }
  }

  public closestLocations(actorID: number, instanceID: number, timestamp: number): [TimedLocation, TimedLocation?] | null {
    const locs = (this.$locations.at(actorID) ?? []).at(instanceID);
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
  public estimateLocation(actorID: number, instanceID: number, timestamp: number, lerp = false): LocationMatch|null {
    const locs = this.closestLocations(actorID, instanceID, timestamp);
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

  /**
   * Trim the known locations list to remove locations too near each other in
   * time. The goal is to have one event per `resolution` interval for each
   * actor instance and discard the rest.
   *
   * @param resolution Target resolution, in units of the timestamps used.
   */
  public trimLocations(resolution: number = 100): void {
    this.$locations.forEach((instanceLocations) => {
      instanceLocations.forEach((locations, instanceID) => {
        const newLocations: TimedLocation[] = [];
        locations.forEach((location, i, arr) => {
          // Do we want to include this location in the trimmed list?
          if(newLocations.length === 0 || // There's no previous location
            i === arr.length - 1 || // There's no next location
            // Or the *following* location would result in a gap of more than `resolution`
            arr[i+1].timestamp - newLocations[newLocations.length-1].timestamp > resolution
          ) {
            newLocations.push(location);
          }
        });
        instanceLocations[instanceID] = newLocations;
      });
    });    
  }

  public toJson(space?: string | number) {
    return JSON.stringify(this.toSaveData(), null, space);
  }
  public toSaveData(): LocationSaveData {
    const saveData: LocationSaveData = [];
    this.$locations.forEach((instanceLocations, actorID) => {
      instanceLocations.forEach((locations, instanceID) => {
        saveData.push({actorID, instanceID, locations})
      });
    });
    return saveData;
  }
  public knownActorIDs() {
    return this.$locations.map((_, index) => index);
  }

}

