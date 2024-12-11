import aacm1 from "../analysis/aac/aacm1.jpg";
import aacm2 from "../analysis/aac/aacm2.jpg";
import aacm3 from "../analysis/aac/aacm3.jpg";

export type ZoneProps = {
  readonly image: string,
  readonly scale?: number
}

export type Zone = ZoneProps | keyof typeof Zones;

export const Zones: Record<string, ZoneProps> = {
  "aacm1": { image: aacm1 },
  "aacm2": { image: aacm2 },
  "aacm3": {
    image: aacm3,
    scale: 0.75
  }
} as const;
