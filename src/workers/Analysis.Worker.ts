import { postWorkerMessage } from './worker';
import supabase, { workerSupabase } from '../supabase/client';
import { fetchReportV1 } from '../fflogs/reports-v1';
import dayjs from 'dayjs';
import { invariant } from '@tanstack/react-router';
import { TablesInsert } from '../supabase/database.types';
import { Locator } from '../analysis/locator';
import { fetchAllEvents } from '../fflogs/events';
import { updateLocatorFromEvent } from '../fflogs/locations';
import { getLogger } from 'loglevel';
import { AnalysisMessage } from './Analysis';

const logger = getLogger("Analysis.Worker");
logger.setLevel("DEBUG");

self.onmessage = async (e: MessageEvent<AnalysisMessage>) => {
  const {access_token, refresh_token, reportCode} = e.data;
  logger.info("Starting processing for report", reportCode);
  try {
    if(access_token === undefined || refresh_token === undefined) {
      throw new Error("Must be authenticated to create reports");
    }
    const {data: setSession, error: setError} = await workerSupabase.auth.setSession({access_token, refresh_token})
    if(setError !== null) throw setError;
    logger.debug("Set session:", setSession);
    const {data: {session}, error: getError} = await workerSupabase.auth.getSession()
    if(getError !== null) throw getError;
    logger.debug("get session:", session);
    if(session === null) {
      throw new Error("Failed to create session (but no error was returned)");
    }
    postWorkerMessage({
      type: "progress",
      taskProgress: 0,
      totalProgress: 0,
      message: "Fetching report metadata"
    })
    const reportMeta = await fetchReportV1(reportCode);
    const report_start = dayjs(reportMeta.startTime);
    const { data } = await supabase.from("reports").insert({
      code: reportCode, 
      owner: session.user.id,
      start_time: report_start.toISOString(),
      end_time: dayjs(reportMeta.endTime).toISOString(),
      title: reportMeta.title
    }).select().throwOnError();
    invariant(data);
    const report_db_id = data[0].id;
    console.log("Created new report", data);
    await supabase.from("report_actors").insert(
      reportMeta.actors.map(
        report_actor => ({
          id: report_actor.id,
          report_id: report_db_id,
          game_id: report_actor.gameID,
          name: report_actor.name,
          type: report_actor.type,
          subtype: report_actor.subType
        })
      )
    ).throwOnError();
    let completeFights = 0;
    await Promise.all(
      reportMeta.fights.map(async (fight) => {
        // Insert the fight basics; we'll fill out action_ids and locator later
        const {data} = await supabase.from("report_fights").insert({
          report_id: report_db_id,
          fight_number: fight.id,
          name: fight.name,
          start_time: report_start.add(fight.startTime, "milliseconds").toISOString(),
          end_time: report_start.add(fight.endTime, "milliseconds").toISOString(),
          encounter_id: fight.encounterID,
          in_progress: fight.inProgress,
          zone_id: fight.gameZone.id,
          zone_name: fight.gameZone.name,
          combat_time: fight.combatTime,
          boss_percentage: fight.bossPercentage,
          locator_data: null,
          actions: [],
          actors: fight.friendlyPlayers.concat(fight.enemyNPCs.map(npc => npc.id))
        }).select().throwOnError();
        invariant(data);
        const npcIDs = new Set(fight.enemyNPCs.map(npc => npc.id));
        const fight_db_id = data[0].id;
        const fightEvents: TablesInsert<"fight_events">[] = [];
        const fightActionIDs = new Set<number>();
        const locator = new Locator();
        const allEvents = await fetchAllEvents({reportID: reportCode, startTime: fight.startTime, endTime: fight.endTime});
        for(const event of allEvents) {
          updateLocatorFromEvent(locator, event);
          if(event.type === "cast" && event.sourceID !== undefined && npcIDs.has(event.sourceID)) {
            fightEvents.push({
              fight_id: fight_db_id,
              timestamp: event.timestamp,
              type: "cast",
              source_id: event.sourceID,
              source_instance: event.sourceInstance,
              target_id: event.targetID,
              target_instance: event.targetInstance,
              action_id: event.abilityGameID
            });
            fightActionIDs.add(event.abilityGameID);
          }
        }
        locator.trimLocations(100);
        await supabase.from("report_fights").update({
          actions: [...fightActionIDs.values()],
          locator_data: locator.toSaveData()
        }).eq("id", fight_db_id);
        completeFights++;
        postWorkerMessage({
          type: "progress",
          taskProgress: completeFights/reportMeta.fights.length,
          totalProgress: completeFights/reportMeta.fights.length,
          message: `Fetching fights`
        });
      })
    );
    postWorkerMessage({
      type: "complete",
      message: "Import complete",
      result: report_db_id
    });
  }
  catch(e: unknown) {
    logger.error("Error in analayis", e);
    postWorkerMessage({
      type: "error",
      message: String(e)
    })
  }
}

logger.info("Worker starting up");
