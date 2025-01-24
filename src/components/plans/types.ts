import React, { act } from "react";
import { GroupPart, Part, Plan } from "./schemas";
import { useImmerReducer } from 'use-immer';

type PartPath = {
  page: number,
  arena: number,
  layer: number,
  path: number[],
}

type ChangePartAction = {
  type: "part",
  newPart: Part
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



type ChangeAction = ChangePartAction | ChangePageAction | AddToLayerAction;

function reducer(plan: Plan, action: ChangeAction): void {
  switch(action.type) {
    case "page": {
      plan.pages[action.page].notes = action.notes;
      plan.pages[action.page].title = action.title;
      return;
    }
    case "addToLayer": {
      plan.pages[action.page].arenas[action.arena].layers[action.layer].parts.push(action.part);
      return;
    }    
    case "part": {
      const layer = plan.pages[action.page].arenas[action.arena].layers[action.layer];
      if(action.path.length === 1) {
        layer.parts[action.path[0]] = action.newPart;
      } else {
        // TODO: Could use a refactor, this is a bit ugly w.r.t. typing and the
        // duplicate type check.

        // Will eventually hold the parent Group of the part we want to swap
        let parent = layer.parts[action.path[0]];
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
          parent = parent.elements[action.path[i]];
        }
        // Finally, use the last index to swap 
        (parent as GroupPart).elements[action.path[action.path.length-1]] = action.newPart;
      }
    }
  }
}

export function useEditablePlan(savedPlan: Plan) {
  const [plan, dispatch] = useImmerReducer(reducer, savedPlan);
  const changers = {
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
                parts: layer.parts.map(
                  (part, part_idx) => markPartChanger(
                    dispatch,
                    part,
                    {
                      page: page_idx,
                      arena: arena_idx,
                      layer: layer_idx,
                      path: [part_idx]
                    }
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
  children: PartChanger[]
}

function markPartChanger(dispatch: React.Dispatch<ChangeAction>, part: Part, path: PartPath): PartChanger {
  const onChange = (newPart: Part) => {
    dispatch({type: "part", ...path, newPart});
  };
  if(part.type === "group") {
    return {
      onChange,
      children: part.elements.map(
        (child, child_idx) => 
          markPartChanger(dispatch, child, {...path, path: [...path.path, child_idx]})
      )
    }
  } else {
    return {
      onChange,
      children: []
    };
  }
}