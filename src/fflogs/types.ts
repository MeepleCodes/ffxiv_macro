export interface Resources {
  x: number;
  y: number;
  facing: number;
  hitPoints: number;
  maxHitPoints: number;
  mp: number;
  maxMP: number;
  tp: number;
  maxTP: number;
}

export interface Event {
  type: string;
  timestamp: number;
  sourceID?: number;
  sourceInstance?: number;
  targetID?: number;
  targetInstance?: number;
  abilityGameID: number;
  extraAbilityGameID?: number;
  fight: number;
  sourceResources?: Resources;
  targetResources?: Resources;
}

export type BeginCast = {
  timestamp: number;
  type: "begincast";
  sourceID: number;
  sourceInstance?: number;
  targetID: number;
  targetInstance?: number;
  abilityGameID: number;
  fight: number;
  duration: number;
}

export type Cast = {
  timestamp: number;
  type: "cast";
  sourceID: number;
  sourceInstance?: number;
  targetID: number;
  targetInstance?: number;
  abilityGameID: number;
  fight: number;
  melee?: true;
  sourceResources?: Resources;
  targetResources?: Resources;
}

export type CastEvent = BeginCast | Cast;