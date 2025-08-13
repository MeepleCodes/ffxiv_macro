/**
 * FFLogs V1 API for fetching report summary data (report + list of fights)
 */

import { z } from "zod";
import { Report, ReportActor, ReportFightNPC } from "./types.ts";

const ReportV1 = z.object({
  lang: z.string(),
  logVersion: z.number(),
  gameVersion: z.number(),
  title: z.string(),
  owner: z.string(),
  start: z.number().int().positive().describe("ms since epoch"),
  end: z.number().int().positive().describe("ms since epoch"),
  zone: z.number().int(),
  friendlies: z.array(z.object({
    id: z.number().int(),
    guid: z.number().int(),
    name: z.string(),
    type: z.string(),
    icon: z.string(),
    server: z.string(),
    fights: z.array(z.object({
      id: z.number()
    }))
  })),
  enemies: z.array(z.object({
    id: z.number().int(),
    guid: z.number().int(),
    name: z.string(),
    type: z.string(),
    icon: z.string(),
    fights: z.array(z.object({
      id: z.number(),
      instances: z.number(),
      groups: z.number().optional()
    }))
  })),
  fights: z.array(z.object({
    id: z.number(),
    boss: z.number().describe("'encounterID' in V2"),
    inProgress: z.boolean(),
    start_time: z.number().int().positive().describe("ms since report start time"),
    end_time: z.number().int().positive().describe("ms since report start time"),
    name: z.string(),
    zoneID: z.number().describe("gameZone.id in V2"),
    combatTime: z.number(),
    bossPercentage: z.number(),
    maps: z.array(z.object({
      mapID: z.number(),
      mapName: z.string().describe("gameZone.name in V2"),
      mapFile: z.string()
    }))
    // Ignoring a lot of extra fields
  }))
  // Ignored fields:
  // friendlyPets: []
  // enemyPets: []
  // exportedCharacters: []
});

type ReportV1 = z.infer<typeof ReportV1>;

function fightNPCs(fightID: number, report: ReportV1): ReportFightNPC[] {
  const npcs: ReportFightNPC[] = [];
  report.enemies.forEach(enemy => {
    const inFight = enemy.fights.find(v => v.id == fightID);
    if(inFight !== undefined) {
      npcs.push({
        id: enemy.id,
        gameID: enemy.guid,
        instanceCount: inFight.instances,
        groupCount: inFight.groups,
        petOwner: 0
      })
    }
  });
  return npcs;
}

export async function fetchReportV1(api: string, key: string, reportID: string): Promise<Report> {
  const raw = await fetch(
    `${api}/report/fights/${reportID}?api_key=${key}`
  ).then(
    resp => resp.json()
  ).then(
    json => ReportV1.parse(json)
  );
  return {
    code: reportID,
    title: raw.title,
    startTime: raw.start,
    endTime: raw.end,
    fights: raw.fights.map(v1 => ({
      id: v1.id,
      name: v1.name,
      inProgress: v1.inProgress,
      encounterID: v1.boss,
      startTime: v1.start_time,
      endTime: v1.end_time,
      combatTime: v1.combatTime,
      bossPercentage: v1.bossPercentage,
      gameZone: {
        id: v1.zoneID,
        name: v1.maps[0].mapName
      },
      friendlyPlayers:
        raw.friendlies.filter(
          friendly => friendly.fights.some(f => f.id == v1.id)
        ).map(
          friendly => friendly.id
        ),
      enemyNPCs: fightNPCs(v1.id, raw),
    })),
    actors: raw.enemies.map<ReportActor>(enemy => ({
      id: enemy.id,
      gameID: enemy.guid,
      icon: enemy.icon,
      name: enemy.name,
      petOwner: null,
      server: null,
      type: "NPC",
      subType: enemy.type
    })).concat(
      raw.friendlies.map<ReportActor>(friendly => ({
        id: friendly.id,
        gameID: friendly.guid,
        icon: friendly.icon,
        name: friendly.name,
        petOwner: null,
        server: friendly.server,
        type: "Player",
        subType: friendly.type
      }))
    ),
    // FIXME: Abilities in V1 are inlined into every event, so we have to use the V1
    // event loaders or find a way around that :<
    abilities: []
  };
}