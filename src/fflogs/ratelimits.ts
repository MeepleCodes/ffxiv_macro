import { client } from "./client";

export type RateLimitData = {
  // The total amount of points this API key can spend per hour.
  limitPerHour: number;
  // The total amount of points spent during this hour.
  pointsSpentThisHour: number;
  // The number of seconds remaining until the points reset.
  pointsResetIn: number;
  };

type RawRateLimitData = {
  rateLimitData: RateLimitData
}

const rateLimitQuery = `
query RateLimitData {
  rateLimitData {
    limitPerHour
    pointsSpentThisHour
    pointsResetIn
  }
}
`;

export async function getRateLimitData(): Promise<RateLimitData> {
  return client.request<RawRateLimitData>(rateLimitQuery).then(data => data.rateLimitData);
}