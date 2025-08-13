import aacm1 from "../analysis/aac/aacm1.jpg";
import aacm2 from "../analysis/aac/aacm2.jpg";
import aacm3 from "../analysis/aac/aacm3.jpg";
import aacm4_1 from "../analysis/aac/aacm4.p1.jpg";

export type ZoneProps = {
  image: string,
  scale?: number
}

export type Zone = ZoneProps | keyof typeof Zones;

export const Zones = {
  "aacm1": { image: aacm1 },
  "aacm2": { image: aacm2 },
  "aacm3": {
    image: aacm3,
    scale: 0.75
  },
  "aacm4-1": { image: aacm4_1 },
} as const;
