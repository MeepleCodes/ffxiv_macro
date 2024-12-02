import path from "path";
import { importOrFetch } from '../src/fflogs/client';
import { importOrFetchMeta } from "../src/fflogs/reports";
import { importOrFetchLocations } from "../src/fflogs/locations";
import { BeeEvent } from "../src/routes/analysis/aacm2s/bees/bees.types";

console.log("Starting");
const outpath = path.resolve(__dirname, "../public/analysis/aacm2s");
// const reportId = "Yc98LCA3vQdPnBFw";
const reportId = "BNgWFPxt97Q3pkJv";

const meta = await importOrFetchMeta(path.resolve(outpath, `meta.${reportId}.json`), reportId);
console.log("Fetching metadata, contains %d fights, %d actors, %d abilities", meta.fights.length, meta.actors.length, meta.abilities.length);

const beesQuery = `
query ReportData($reportID: String!, $startTime: Float!, $endTime: Float!) {
    reportData {
        report(code: $reportID) {
            events(
                startTime: $startTime
                endTime: $endTime
                dataType: Casts
                abilityID: 39629
                hostilityType: Enemies
                includeResources: true
                limit: 1000
            ) {
                data
            }
            secondWave: events(
                startTime: $startTime
                endTime: $endTime
                dataType: Casts
                abilityID: 39628
                hostilityType: Enemies
                includeResources: true
                limit: 1000
            ) {
                data
            }
        }
    }
}
`;


type BeesRaw = {reportData: {report: {events: {data: BeeEvent[] }, secondWave: {data: BeeEvent[] }}}};

const beeCasts = await importOrFetch(
  path.resolve(outpath, "bees", `beeCasts.${reportId}.json`),
  beesQuery,
  meta.fights.map(
    fight => {
      return {reportID: reportId, startTime: fight.startTime, endTime: fight.endTime};
    }
  ),
  {
    postProcess: (raw: BeesRaw) => ({
      firstWave: raw.reportData.report.events.data,
      secondWave: raw.reportData.report.secondWave.data
    })
  }
);

const locations = await importOrFetchLocations(
  path.resolve(outpath, "bees", `locations.${reportId}.json`),
  meta.fights.map(
    fight => ({reportID: reportId, startTime: fight.startTime + 210000, endTime: fight.startTime + 250000})
  )
);
