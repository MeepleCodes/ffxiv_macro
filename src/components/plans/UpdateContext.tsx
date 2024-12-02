import React from "react";
import { Part } from "./plans";

// export const UpdateContext = {
//   spliceIn: <T extends Part>(existing: T[], newSelf: T): T[] => {
//     const idx = existing.findIndex(e => e.id === newSelf.id);
//     return idx === -1 ? 
//       [...existing, newSelf] :
//       existing.toSpliced(
//         idx,
//         1,
//         newSelf
//       );
//   },
//   ...React.createContext((newSelf: Part) => {
//     console.error("Used default update context!", newSelf);
//   })
// }
export const UpdateContext = React.createContext((newSelf: Part) => {
      console.error("Used default update context!", newSelf);
    })