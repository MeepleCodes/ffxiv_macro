import dayjs from "dayjs";
import { ReportFight } from "../../../../fflogs/reports";


/**
 * Format an event timestamp as time-since-start-of-fight in mm:ss[.ddd...] format.
 * 
 * @param timestamp Event timestamp (milliseconds since epoch)
 * @param fight Fight (the startTime will be taken from here)
 * @param decimals Number of decimal places to show on the sceonds field
 */
export function fightTs(timestamp: number, fight: ReportFight, decimals = 0): string {
  const dur = dayjs.duration(timestamp - fight.startTime, "milliseconds");
  const wholeSeconds = dur.format("mm:ss");
  if(decimals <= 0) return wholeSeconds;
  return `${wholeSeconds}.${(dur.milliseconds()/1000).toFixed(Math.min(decimals, 3)).slice(2)}`;
}