import { z } from 'zod';

import { AnyPart, PartSchema } from '../src/components/plans/schemas'


const data = PartSchema.parse(
  {
    id: "g1",
    type: "group",
    elements: [
      {
        id: "one",
        type: "aoecone",
        location: {
          x: 10,
          y: 10
        },
        angle: 60,
        range: 10
      },
      {
        id: "two",
        type: "aoedonut",
        location: {
          x: 10,
          y: 10
        },
        innerRadius: 10,
        outerRadius: 20
      }
    ]
  }

);
console.log(data);

function f(p: AnyPart) {
  if(p.type === "group") {
    const e = p.elements;
  }
}