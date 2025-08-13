import React from "react";
import { GroupPart, Part, PartTypeName, Plan, SpecificPart } from "./schemas";
import { DraftFunction, useImmerReducer } from 'use-immer';
import { Zone } from "../drawing/zones";
import { invariant } from "@tanstack/react-router";

export type Update<T> = T | DraftFunction<T>;

type PartPath = {
  page: number,
  arena: number,
  layer: number,
  path: number[],
}
type ChangePlanAction = {
  type: "plan",
  zone: Zone
}
type ChangePartAction = {
  type: "part",
  newPart: Update<Part>,
} & PartPath;

type ChangePageAction = {
  type: "page",
  page: number,
  notes: string,
  title: string
}

type AddToLayerAction = {
  type: "addToLayer",
  part: Part,
  page: number,
  arena: number,
  layer: number
};



type ChangeAction = ChangePartAction | ChangePageAction | AddToLayerAction | ChangePlanAction;

function reducer(plan: Plan, action: ChangeAction): void {
  switch(action.type) {
    case "page": {
      plan.pages[action.page].notes = action.notes;
      plan.pages[action.page].title = action.title;
      return;
    }
    case "plan": {
      plan.zone = action.zone;
      return;
    }
    case "addToLayer": {
      plan.pages[action.page].arenas[action.arena].layers[action.layer].children.push(action.part);
      return;
    }    
    case "part": {
      const layer = plan.pages[action.page].arenas[action.arena].layers[action.layer];
      if(action.path.length === 1) {

        if(typeof action.newPart === "function") {
          action.newPart(layer.children[action.path[0]]);
         } else {
          layer.children[action.path[0]] = action.newPart;
         }
      } else {
        // TODO: Could use a refactor, this is a bit ugly w.r.t. typing and the
        // duplicate type check.

        // Will eventually hold the parent Group of the part we want to swap
        let parent = layer.children[action.path[0]];
        if(parent.type !== "group") {
          throw new Error(`Change path ${String(action.path)} for pages[${action.page}].arenas[${action.arena}].layers[${action.layer}] targetted non-group part at index 0, got ${parent.type} instead`);
        }
        // Skip the first one (was index into layer) and the last one (will be
        // the actual element we're replacing). For the rest of the path, walk
        // down to the next level.
        for(let i=1; i<action.path.length-1; i++) {
          if(parent.type !== "group") {
            throw new Error(`Change path ${String(action.path)} for pages[${action.page}].arenas[${action.arena}].layers[${action.layer}] targetted non-group part at index ${i}, got ${parent.type} instead`);
          }
          parent = parent.children[action.path[i]];
        }
        // Finally, use the last index to swap 
        if(typeof action.newPart === "function") {
          action.newPart((parent as GroupPart).children[action.path[action.path.length-1]]);
        } else {
          (parent as GroupPart).children[action.path[action.path.length-1]] = action.newPart;
        }
      }
    }
  }
}

export function useEditablePlan(savedPlan: Plan) {
  const [plan, dispatch] = useImmerReducer(reducer, savedPlan);
  const idMap: Record<string, PartPath> = {};
  function byId(id: string, newPart: Update<Part>): void;
  function byId<T extends PartTypeName>(id: string, type: T, newPart: Update<SpecificPart<T>>): void;
  function byId<T extends PartTypeName>(id: string, typeOrNew: T | Update<Part>, maybeNewPart?: Update<SpecificPart<T>>) {
    if(!(id in idMap)) throw new Error(`Failed to find path for part ID ${id}`);
    if(maybeNewPart !== undefined) {
      // Should check that the requested part is actually of the correct type!
      dispatch({
        type: "part",
        ...idMap[id],
        newPart: maybeNewPart as Update<Part>
      });
     } else {
      dispatch({
        type: "part",
        ...idMap[id],
        newPart: typeOrNew as Update<Part>
      });
     }
    const newPart = typeof typeOrNew === "string" ? maybeNewPart : typeOrNew;
    invariant(newPart !== undefined);
    

  }
  const changers = {
    zone: (zone: Zone) => {
      dispatch({type: "plan", zone});
    },
    // byId: (id: string, newPart: Update<Part>) => {
    //   if(!(id in idMap)) throw new Error(`Failed to find path for part ID ${id}`);
    //   dispatch({
    //     type: "part",
    //     ...idMap[id],
    //     newPart
    //   });
    // },
    byId,
    pages: plan.pages.map(
      (page, page_idx) => ({
        changePage: (newNotes: string, newTitle: string) => {
          dispatch({type: "page", page: page_idx, notes: newNotes, title: newTitle})
        },
        arenas: page.arenas.map(
          (arena, arena_idx) => ({
            layers: arena.layers.map(
              (layer, layer_idx) => ({
                onAdd: (newPart: Part) => {
                  dispatch({
                    type: "addToLayer",
                    part: newPart,
                    page: page_idx,
                    arena: arena_idx,
                    layer: layer_idx,
                  });
                },
                parts: layer.children.map(
                  (part, part_idx) => makePartChanger(
                    dispatch,
                    part,
                    {
                      page: page_idx,
                      arena: arena_idx,
                      layer: layer_idx,
                      path: [part_idx]
                    },
                    idMap
                  )
                )
              })
            )
          })
        )
      })
    )
  }
  return {plan, changers};
}

export type PlanChanger = ReturnType<typeof useEditablePlan>["changers"];

export type PartChanger = {
  onChange: (newPart: Part) => void,
  path: PartPath,
  children: PartChanger[]
}

function makePartChanger(dispatch: React.Dispatch<ChangeAction>, part: Part, path: PartPath, idMap: Record<string, PartPath>): PartChanger {
  const onChange = (newPart: Part) => {
    dispatch({type: "part", ...path, newPart});
  };
  idMap[part.id] = path;
  if(part.type === "group") {
    return {
      onChange,
      path,
      children: part.children.map(
        (child, child_idx) => 
          makePartChanger(dispatch, child, {...path, path: [...path.path, child_idx]}, idMap)
      )
    }
  } else {
    return {
      onChange,
      path,
      children: []
    };
  }
}