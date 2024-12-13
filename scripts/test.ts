import { z } from 'zod';

import { canLerp } from '../src/components/plans/animations';

console.log(canLerp(z.number()));
console.log(canLerp(z.number().optional()));
console.log(canLerp(z.number().default(10)));
console.log(canLerp(z.number().describe("an number")));
console.log(canLerp(z.object({
  foo: z.number()
})))