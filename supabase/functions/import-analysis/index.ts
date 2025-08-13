
/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/import-analysis' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

import { fetchReportV1 } from './fflogs/reports-v1.ts';
import dayjs from 'dayjs';
import { Locator } from './analysis/locator.ts';
import { fetchAllEvents } from './fflogs/events.ts';
import { updateLocatorFromEvent } from './fflogs/locations.ts';
import { getLogger } from 'loglevel';
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from '@supabase/supabase-js'
import invariant from 'tiny-invariant';

const logger = getLogger("Analysis.Worker");
logger.setLevel("DEBUG");

function progress(task: number, total: number, message?: string) {
  // postWorkerMessage({
  //   type: "progress",
  //   taskProgress: 0,
  //   totalProgress: 0,
  //   message: "Fetching report metadata"
  // })
  logger.info(`[${(task*100).toFixed(0).padStart(3)}%/${(total*100).toFixed(0).padStart(3)}]: ${message ?? ''}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }  
  const {reportCode, api, key} = await req.json();
  const authHeader = req.headers.get('Authorization')!
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
  logger.info("Starting processing for report", reportCode);
  try {
    const {error, data: {user}} = await supabase.auth.getUser();
    if(error !== null) throw error;
    if(user === null) {
      throw new Error("Must be authenticated to import analysis");
    }
    progress(0, 0, "Fetching report metadata");
    const reportMeta = await fetchReportV1(api, key, reportCode);
    const report_start = dayjs(reportMeta.startTime);
    const { data } = await supabase.schema("analysis").from("reports").insert({
      code: reportCode, 
      owner: user.id,
      start_time: report_start.toISOString(),
      end_time: dayjs(reportMeta.endTime).toISOString(),
      title: reportMeta.title
    }).select().throwOnError();
    invariant(data);
    const report_db_id = data[0].id;
    console.log("Created new report", data);
    await supabase.schema("analysis").from("report_actors").insert(
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
        const {data} = await supabase.schema("analysis").from("report_fights").insert({
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
        // const fightEvents: TablesInsert<{schema: "analysis"}, "fight_events">[] = [];
        const fightEvents: any[] = [];
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
        await supabase.schema("analysis").from("report_fights").update({
          actions: [...fightActionIDs.values()],
          locator_data: locator.toSaveData()
        }).eq("id", fight_db_id);
        completeFights++;
        progress(
          completeFights/reportMeta.fights.length,
          completeFights/reportMeta.fights.length,
          "Fetching fights"
        );
      })
    );
    return new Response(JSON.stringify({report_id: report_db_id}), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  }
  catch(e: unknown) {
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
);