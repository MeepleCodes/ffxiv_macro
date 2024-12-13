import { TimelineSchema } from "../src/components/plans/schemas";

TimelineSchema.parse({
  id: "one",
  type: "timeline",
  partType: "aoecircle",
  part: {
    id: "p1",
    type: "aoecircle",
  }
})