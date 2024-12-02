export type BeeBeginCast = {
  timestamp: number;
  type: "begincast";
  sourceID: number;
  sourceInstance: number; // Probably optional in all casts
  targetID: number;
  targetInstance: number; // Ditto
  abilityGameID: number;
  fight: number;
  duration: number;
}
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
export type BeeCast = {
  timestamp: number;
  type: "cast";
  sourceID: number;
  sourceInstance: number;
  targetID: number;
  abilityGameID: number;
  fight: number;
  sourceResources: Resources;
  targetResources?: Resources;
}
export type BeeEvent = BeeCast | BeeBeginCast;