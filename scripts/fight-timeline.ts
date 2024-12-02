import path from "path";
import { fetchAllPages, importOrFetch } from "../src/fflogs/client";
import { importOrFetchMeta } from "../src/fflogs/reports";
import { CastEvent } from "../src/fflogs/types";

const reportID = "Yc98LCA3vQdPnBFw";
const outpath = "public/analysis/casts";

const meta = await importOrFetchMeta(path.resolve(outpath, `meta.${reportID}.json`), reportID);

const castsQuery = `
query ReportData($reportID: String!, $startTime: Float!, $endTime: Float!) {
  reportData {
      report(code: $reportID) {
          events(
              hostilityType: Enemies
              limit: 10000
              startTime: $startTime
              endTime: $endTime
              dataType: Casts
              filterExpression: "source.class = \\"Boss\\""
            ) {
                data
                nextPageTimestamp
            }
      }              
  }
}`;

await importOrFetch(
  path.resolve(outpath, `casts.${reportID}.json`),
  castsQuery,
  meta.fights.map(fight => ({
    reportID,
    startTime: fight.startTime,
    endTime: fight.endTime
  })),
  {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    fetch: fetchAllPages<CastEvent>(raw => raw.reportData.report.events)
  }
);
