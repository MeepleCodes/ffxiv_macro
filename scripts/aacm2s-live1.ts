
import path from "path";
import { promises } from "fs";
import { client } from '../src/fflogs/client';

console.log("Starting");
const outpath = "src/routes/analysis/aacm2s";
const report = "Yc98LCA3vQdPnBFw";

type MetaType = {
  reportData: {
    report: {
      fights: ReportFight[]
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
type ReportFight = {
  id: string,
  name: string,
  startTime: number,
  endTime: number,
  enemyNPCs: ReportFightNPC[],
  friendlyPlayers: number[]
};
type ReportFightNPC = {
  // The game ID of the actor. This ID is used in events to identify sources and targets.
  gameID: number
  // The report ID of the actor. This ID is used in events to identify sources and targets.
  id: number
  // How many instances of the NPC were seen during the fight.
  instanceCount: number
  // How many packs of the NPC were seen during the fight.
  groupCount: number
  // The report ID of the actor that owns this NPC (if it is a pet). This ID is used in events to identify sources and targets.
  petOwner: number
};
async function fetchMeta(): Promise<MetaType> {
  // Fetch the metadata we need
  const meta = await client.request<MetaType>(`
    query ReportData($code: String!) {
      reportData {
          report(code: $code) {
              fights {
                  endTime
                  id
                  name
                  startTime
                  enemyNPCs
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
    }`, { code: report });
  await promises.writeFile(
    path.resolve(outpath, "meta.json"),
    JSON.stringify(meta)
  );
  console.log("Saved metadata to %s", path.resolve(outpath, "meta.json"));
  return meta;
}


const damageData: any[] = [];
const heartsData: any[] = [];

async function fetchFight(fight: typeof meta.reportData.report.fights[number]) {
  const vars = {
    code: report,
    debuffsFrom: fight.startTime + 76000,
    debuffsTo: fight.startTime + 80000,
    damageFrom: fight.startTime, //+ 66000,
    damageTo: fight.startTime + 80000
  };
  const query = `
query ReportData($code: String!, $debuffsFrom: Float!, $debuffsTo: Float!, $damageFrom: Float!, $damageTo: Float!) {
    reportData {
        report(code: $code) {
            hearts: events(
                limit: 8
                startTime: $debuffsFrom
                endTime: $debuffsTo
                dataType: Debuffs
                filterExpression: "source.type = \\"NPC\\""
            ) {
                data
            }
            damage: events(
              limit: 10000
              startTime: $damageFrom
              endTime: $damageTo
              includeResources: true
            ) {
              data
            }
        }
    }
}`;
  const fightData: any = await client.request(query, vars);
  damageData.push(...fightData.reportData.report.damage.data);
  heartsData.push(...fightData.reportData.report.hearts.data);
  await promises.writeFile(
    path.resolve(outpath, `fight-${fight.id}.json`),
    JSON.stringify(fightData)
  );
  console.log("Saved fight %d data to %s", fight.id, path.resolve(outpath, `fight-${fight.id}.json`));
}
async function saveFights() {
  await promises.writeFile(
    path.resolve(outpath, `hearts.json`),
    JSON.stringify({
      damageData: damageData,
      heartsData: heartsData
    })
  )
}


import meta from "../src/routes/analysis/aacm2s/meta.json";
// const meta = await fetchMeta();
for (const fight of meta.reportData.report.fights) {
  await fetchFight(fight);
};
// await fetchFight(meta.reportData.report.fights[3]);
await saveFights();