import dayjs from "dayjs";
import { Actor, ActorInstance, Cast, Fight, Report, ReportSummary, ReportActions } from "../analysis/types";
import supabase from "./client";
import { invariant } from "@tanstack/react-router";
import { Action, fromSql, unknownAction } from "../excel/Action.types";
import { LocationSaveData, Locator } from "../analysis/locator";

export class NotFoundError extends Error{}

/**
 * Fetch all report summaries for the current user
 */
export async function fetchReportSummaries(): Promise<ReportSummary[]> {
  // const {data: {user}} = await supabase.auth.getUser();
  // if(user === null) return [];
  const {data: reports} = await supabase
    .from("reports")
    .select("*, report_fights(count)")
    // .eq("owner", user.id)
    .order("created_at");
  console.log("Report summaries", reports);
  return (reports ?? []).map(report => ({
    id: report.id,
    title: report.title ?? "",
    code: report.code,
    createdAt: dayjs(report.created_at),
    startTime: dayjs(report.start_time),
    endTime: dayjs(report.end_time),
    fights: report.report_fights[0].count
  }));
}

/**
 * Fetch a single report by ID, including summaries of all fights
 * in the report and the actor map.
 * 
 * Throws a NotFoundError if the report couldn't be loaded (either because
 * it doesn't exist or the current user isn't allowed to view it).
 * 
 * @param id Report ID
 */
export async function fetchReport(id: number): Promise<Report> {
  const {data: report} = await supabase
    .from("reports")
    .select("*, report_fights(*)")
    .eq("id", id)
    .order("fight_number", {referencedTable: "report_fights"})
    .maybeSingle();
  if(report === null) throw new NotFoundError();
  // Pull this out now otherwise TS thinks it might be null inside the map()
  return {
    id: report.id,
    code: report.code,
    title: report.title ?? "",
    createdAt: dayjs(report.created_at),
    startTime: dayjs(report.start_time),
    endTime: dayjs(report.end_time),
    fights: report.report_fights.map(fight => ({
      id: fight.id,
      reportID: fight.report_id,
      fightNumber: fight.fight_number,
      name: fight.name,
      encounterID: fight.encounter_id,
      zone: {
        id: fight.zone_id,
        name: fight.zone_name
      },
      bossPercentage: fight.boss_percentage,
      startTime: dayjs(fight.start_time),
      endTime: dayjs(fight.end_time),
      combatTime: fight.combat_time,
      inProgress: fight.in_progress
    }))
  }
}

/**
 * Fetch a report and all its events.
 */
export async function fetchFight(reportID: number, fight_number: number): Promise<Fight> {
  console.log("Trying to fetch", reportID, fight_number);
  const {data: fight} = await supabase
    .from("report_fights")
    .select("*, fight_events(*)")
    .eq("report_id", reportID)
    .eq("fight_number", fight_number)
    .order("timestamp", {referencedTable: "fight_events"})
    .maybeSingle();
  if(fight === null) throw new NotFoundError();
  
  // Load the actor and action lookups now we know which IDs we need for each
  const [{data: actorsResult}, {data: actionsResult}] = await Promise.all([
    supabase
      .from("report_actors")
      .select("*")
      .eq("report_id", fight.report_id)
      .in("id", fight.actors)
      .throwOnError()
    ,
    supabase
      .from("actions")
      .select("*")
      .in("id", fight.actions)
      .throwOnError()
  ]);
  invariant(actorsResult && actionsResult);
  const actorMap = new ActorMap(actorsResult.map(
    row => ({
      id: row.id,
      gameID: row.game_id,
      name: row.name,
      type: row.type,
      subType: row.subtype
    } as Actor)
  ));
  const actionMap: Record<number, Action> = Object.fromEntries(
    actionsResult.map(action => ([
      action.id,
      fromSql(action)
    ]))
  );
  const events = fight.fight_events
    .filter(row => row.type === "cast" && row.source_id !== null)
    .map(
      row => ({
        id: row.id,
        type: "cast",
        timestamp: row.timestamp,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        source: actorMap.getActorInstance(row.source_id!, row.source_instance ?? 0),
        target: row.target_id === null ? undefined : actorMap.getActorInstance(
          row.target_id,
          row.target_instance ?? 0
        ),
        ability: actionMap[row.action_id] ?? {...unknownAction, id: row.action_id}
      } as Cast)
    )
  return {
    id: fight.id,
    reportID: fight.report_id,
    fightNumber: fight.fight_number,
    name: fight.name,
    encounterID: fight.encounter_id,
    zone: {
      id: fight.zone_id,
      name: fight.zone_name
    },
    startTime: dayjs(fight.start_time),
    endTime: dayjs(fight.end_time),
    combatTime: fight.combat_time,
    bossPercentage: fight.boss_percentage,
    inProgress: fight.in_progress,
    actions: actionsResult.map(action => fromSql(action)),
    events,
    actors: actorMap.getAllInstances(),
    locator: Locator.fromSaveData((fight.locator_data ?? []) as LocationSaveData)
  }
}

class ActorMap {
  private actorMap: Record<number, {actor: Actor, instances: Set<number>}>;
  constructor(actors: Actor[]) {
    this.actorMap = Object.fromEntries(
      actors.map(actor => ([
        actor.id,
        {
          actor,
          instances: new Set()
        }
      ]))
    );
  }
  public getActorInstance(actorID: number, instance: number): ActorInstance {
    
    if(!(actorID in this.actorMap)) {
      this.actorMap[actorID] = {
        actor: {
          id: actorID,
          gameID: -1,
          name: "<unknown>",
          subType: "NPC",
          type: "NPC",
        },
        instances: new Set()
      }
    }
    const mapEntry = this.actorMap[actorID];
    mapEntry.instances.add(instance);
    return {
      ...mapEntry.actor,
      instance
    };
  }
  public getAllInstances(): ActorInstance[] {
    return Object.entries(this.actorMap)
      .map(
        ([_, mapEntry]) => mapEntry.instances
          .values()
          .toArray()
          .toSorted()
          .map(
            instance => ({...mapEntry.actor, instance})
          )
      ).flat(1);
  }
}

export async function fetchReportActionSummary(reportID: number): Promise<ReportActions> {
  const fightActions = await supabase
    .from("report_fights")
    .select("name, actions")
    .eq("report_id", reportID);
  const allActionsIDs = new Set<number>();
  const encounterActionIDs: Record<string, Set<number>> = {};
  if(fightActions.error) throw fightActions.error;
  for(const fight of fightActions.data) {
    if(!(fight.name in encounterActionIDs)) {
      encounterActionIDs[fight.name] = new Set<number>();
    }
    for(const actionID of fight.actions) {
      allActionsIDs.add(actionID);
      encounterActionIDs[fight.name].add(actionID);
    }
  }
  const allActions = await supabase
    .from("actions")
    .select("*")
    .in("id", allActionsIDs.values().toArray());
  if(allActions.error !== null) throw allActions.error;
  const actionMap = Object.fromEntries(
    allActions.data.map(
      action => ([action.id, fromSql(action)])
    )
  );
  return {
    encounters: Object
      .entries(encounterActionIDs)
      .map(([encounter, actionIDs]) => (
        {
          name: encounter,
          actions: actionIDs.values().map(id => actionMap[id]).toArray()
        }
      ))
  }
}