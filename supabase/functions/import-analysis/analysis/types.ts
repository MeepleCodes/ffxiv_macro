import { Action } from '../excel/Action.types';

export type PlayerActor = {
  id: number;
  gameID: number;
  type: "Player",
  subType: string,
  name: string;  
  icon: string;
}
export type NPCActor = {
  id: number;
  gameID: number;
  type: "NPC",
  subType: "Boss" | "NPC" | "Pet",
  name: string;
  icon: string;
}

export type Cast = {
  timestamp: number;
  type: "cast";
  sourceID: number;
  sourceInstance?: number;
  targetID: number;
  targetInstance?: number;
  ability: Action
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