import { Action } from "../excel/Action";
import { Event } from "../fflogs/types";
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

