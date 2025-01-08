import { importOrFetch } from "./client";
import { Report, ReportFight } from "./types";

/** Query for fetching metadata about a report. Takes one parameter, code, which
 * is the report's ID code */
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
                  inProgress
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


function metaPostProcess(raw: MetaRaw): Report {
  const {code, title, startTime, endTime, fights} = raw.reportData.report;
  return {
    code, title, startTime, endTime, fights,
    ...raw.reportData.report.masterData,
  };
}

export async function importOrFetchMeta(path: string, reportId: string, force = false): Promise<Report> {
  return importOrFetch<Report>(path, metaQuery, {code: reportId}, {postProcess: metaPostProcess, force});
}