import dayjs, { Dayjs } from 'dayjs';
import { Action } from '../excel/Action.types';
import { Locator } from './locator';

export type ReportSummary = {
  id: number;
  code: string;
  title: string;
  createdAt: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  fights: number;
};

export type Report = {
  id: number;
  code: string;
  title: string;
  createdAt: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  fights: FightSummary[];
}



export type PlayerActor = {
  id: number;
  gameID: number;
  type: "Player",
  subType: string,
  name: string;  
  // icon: string;
}
export type NPCActor = {
  id: number;
  gameID: number;
  type: "NPC",
  subType: "Boss" | "NPC" | "Pet",
  name: string;
  // icon: string;
}
export type Actor = PlayerActor | NPCActor;
/**
 * When we see multiple copies of the same NPC, they'll share an actor ID
 * but have difference instance numbers.
 * 
 * We could probably tighten this to only apply to NPCActors but for now it
 * allows the possibility of instances of PlayerActors because the event data
 * could encode it.
 * 
 * Non-instanced actors get an instance ID of 0
 */
export type ActorInstance = Actor & {
  /** Instance of this actor, or 0 if this actor was only seen once */
  instance: number
};

export type FightSummary = {
  /** Row ID for this number; unique when paired with report_id */
  id: number,
  /** ID of the report this fight belongs to, for backreferencing */
  reportID: number,
  /** The number FFLogs assigned to this fight; usually 'id + 1' */
  fightNumber: number,
  /** Name given to the fight, usually derived from encounter ID */
  name: string,
  /** ID of the encounter */
  encounterID: number,
  /** The zone this fight was in */
  zone: {
    id: number,
    name: string
  },
  /** Fight start time as date/time */
  startTime: Dayjs,
  /** Fight end time as date/time */
  endTime: Dayjs,
  /** Combat duration in ms */
  combatTime: number|null,
  /** HP percent the boss was reduced to, 0-100 */
  bossPercentage: number|null;
  /** Is this fight still being uploaded to FFLogs? */
  inProgress: boolean
}

export type Fight = FightSummary & {
  actions: Action[],
  actors: ActorInstance[],
  events: Event[],
  locator: Locator
}

export type Cast = {
  id: number,
  timestamp: number,
  type: "cast",
  source: ActorInstance,
  target?: ActorInstance,
  ability: Action
}

export interface ReportActions {
  encounters: Encounter[];
}

export interface Encounter {
  name: string;
  actions: Action[];
}

export type Event = Cast; // Could add more here later
export type EventTypes = Event["type"];

export function formatTimestamp(timestamp: number, decimals: number = 1) {
  const dur = dayjs.duration(timestamp, "milliseconds");
  const wholeSeconds = dur.format("mm:ss");
  if(decimals <= 0) return wholeSeconds;
  return `${wholeSeconds}.${(dur.milliseconds()/1000).toFixed(Math.min(decimals, 3)).slice(2)}`;

}