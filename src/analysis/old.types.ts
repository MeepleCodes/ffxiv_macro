import { Dayjs } from "dayjs";
import { Action } from "../excel/Action";
import { Event, ReportAbility } from "../fflogs/types";
import { Locator } from "./locator";

export interface ReportActions {
  encounters: Encounter[];
}

export interface Encounter {
  name: string;
  actions: Action[];
}

export interface FightData {
  events: Event[];
  locator: Locator;
  actions: Action[];
}

export type BeginCast = {
  type: "begincast";
  timestamp: number;
  sourceID: number;
  sourceInstance?: number;
  // Begincasts always have a target, though it's often the same as source
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
  ability: Action
  fight: number;
  melee?: true;
}

export type FightEvent = Cast;

export interface ReportFight {
  id: number;
  name: string;
  startTime: number;
  endTime: number;
  encounterID: number;
  inProgress: boolean;
  zoneID: number;
  zoneName: string;
  combatTime: number;
  bossPercentage: number;
  events: FightEvent[];
  locator: Locator;
}

export interface Report {
  id: number;
  code: string;
  end_time: Dayjs;
  start_time: Dayjs;
  title: string;
  fights: ReportFight[];
}