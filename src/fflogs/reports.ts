import { importOrFetch } from "./client";

/** Query for fetching metadata about a report. Takes one parameter, code, which is the report's ID code */
export const metaQuery = `
    query ReportData($code: String!) {
      reportData {
          report(code: $code) {
              code
              title
              startTime
              endTime
              owner {
                id
                name
              }
              fights {
                  endTime
                  combatTime
                  bossPercentage
                  id
                  name
                  gameZone {
                    id
                    name
                  }
                  encounterID
                  startTime
                  enemyNPCs {
                    id
                    gameID
                    instanceCount
                    groupCount
                    petOwner
                  }
                  friendlyPlayers
              }
              masterData {
                  actors {
                      gameID
                      icon
                      id
                      name
                      petOwner
                      server
                      subType
                      type
                  }
                abilities {
                    gameID
                    icon
                    name
                    type
                }                      
              }
          }
      }
    }`;

type MetaRaw = {
  reportData: {
    report: {
      code: string;
      title: string;
      startTime: number;
      endTime: number;
      owner: {
        id: number;
        name: string;
      }
      fights: ReportFight[];
      masterData: {
        actors:
        {
          gameID: number,
          icon: string,
          id: number,
          name: string,
          petOwner: null,
          server: string | null,
          subType: string,
          type: "NPC" | "Player" | "Pet"
        }[]
        abilities: {
          gameID: number,
          icon: string,
          name: string,
          type: string
        }[],
      }
    }
  }
};
export interface ReportIndex {
  code: string;
  title: string;
  startTime: number;
  endTime: number;
}
export interface Report extends ReportIndex {
  fights: ReportFight[];
  actors: ReportActor[];
  abilities: ReportAbility[];
}

export type ReportActor = {
  // The game ID of the actor.
  gameID: number;
  // An icon to use for the actor. For pets and NPCs, this will be the icon the site
  // chose to represent that actor.
  icon: string;
  // The report ID of the actor. This ID is used in events to identify sources and
  // targets.
  id: number;
  // The name of the actor.
  name: string;
  // The report ID of the actor's owner if the actor is a pet.
  petOwner: number|null;
  // The normalized server name of the actor.
  server: string|null;
  // The sub-type of the actor, for players it's their class, and for NPCs, they are
  // further subdivided into normal NPCs and bosses.
  subType: string;
  // The type of the actor, i.e., if it is a player, pet or NPC.
  type: "NPC" | "Player" | "Pet";
};
export type ReportFight = {
  id: number;
  name: string;
  encounterID: number;
  startTime: number;
  endTime: number;
  combatTime: number;
  bossPercentage: number;
  enemyNPCs: ReportFightNPC[];
  friendlyPlayers: number[];
  gameZone: {
    id: number;
    name: string;
  }
};
export type ReportAbility = {
  // The game ID of the ability.
  gameID: number;
  // An icon to use for the ability.
  icon: string;
  // The name of the actor.
  name: string;
  // The type of the ability. This represents the type of damage (e.g., the spell
  // school in WoW).
  type: string;
};
export type ReportFightNPC = {
  // The game ID of the actor. This ID is used in events to identify sources and targets.
  gameID: number;
  // The report ID of the actor. This ID is used in events to identify sources and targets.
  id: number;
  // How many instances of the NPC were seen during the fight.
  instanceCount: number;
  // How many packs of the NPC were seen during the fight.
  groupCount: number;
  // The report ID of the actor that owns this NPC (if it is a pet). This ID is used in events to identify sources and targets.
  petOwner: number;
};

export function metaPostProcess(raw: MetaRaw): Report {
  const {code, title, startTime, endTime, fights} = raw.reportData.report;
  return {
    code, title, startTime, endTime, fights,
    ...raw.reportData.report.masterData,
  };
}

export async function importOrFetchMeta(path: string, reportId: string, force = false): Promise<Report> {
  return importOrFetch<Report>(path, metaQuery, {code: reportId}, {postProcess: metaPostProcess, force});
}