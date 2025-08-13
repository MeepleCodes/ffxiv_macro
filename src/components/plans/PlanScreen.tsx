import { Button, Divider, MenuItem, Paper, Select, Stack } from "@mui/material";

import { PlanDoc, planStore } from "../../supabase/Plans"
import React, { SetStateAction } from "react";
import DocToolbar from "../DocToolbar";
import { Part, Plan } from "./schemas";
import { useEditablePlan } from "./editable";
import PlanEditor from "./PlanEditor";
import { ColourPresets } from "./presets";
import PartPalette from "./PartPalette";
import LayerEditor from "./LayerEditor";
import PropertyEditor from "./PropertyEditor";
import { Zones } from "../drawing/zones";

export type PlanScreenProps = {
  doc?: PlanDoc,
  onIdChange?: (id?: string) => void,
};

const initialPlan: Plan = {
  version: 1,
  zone: "aacm3",
  pages: [
    {
       title: "",
       notes: "Notes for page 1",
       arenas: [
        {
          layers: [
            {
              id: "layer1",
              type: "layer",
              name: "Layer 1",
              visible: true,
              children: [
                {
                  id: "1",
                  name: "AoECircle",
                  type: "aoecircle",
                  x: 100,
                  y: 100,
                  colour: ColourPresets.Red,
                  opacity: 1,
                  range: 6,
                }
              ]
            }
          ]
        }
       ]
    }
  ]
}

export default function PlanScreen(props: PlanScreenProps) {
  const {doc = planStore.new(), onIdChange} = props;
  doc.plan = initialPlan;
  const [liveDoc, setLiveDoc] = React.useState(doc);
  const [selection, setSelection] = React.useState<Set<string>>(new Set());
  const {plan, changers} = useEditablePlan(liveDoc.plan as Plan);
  const findById = (id: string) => {
    function findInner(id: string, parts: Part[]): Part | undefined {
      for(const part of parts) {
        if(part.id === id) return part;
        if("children" in part) {
          const child = findInner(id, part.children);
          if(child !== undefined) return child;
        }
      }
      return undefined;
    }
    // FIXME: Needs to search all layers, should probably build the index on
    // change instead
    return findInner(id, plan.pages[0].arenas[0].layers[0].children);
  }
  
  const setPlan = (newOrUpdate: SetStateAction<Plan>) => {
    setLiveDoc(doc => ({
      ...doc,
      plan: typeof newOrUpdate == "function" ? newOrUpdate(doc.plan as Plan) : newOrUpdate
    }))
  }
  return <>
  <Stack direction="column" width="100%" height="100%">
    <DocToolbar
      liveDoc={liveDoc}
      setLiveDoc={setLiveDoc}
      onIdChange={onIdChange}
      store={planStore}
      sx={{
      p: 0,
      m: 1,
    }}/>
      <Stack direction="row" flex={1}>
        <Paper
        >
          <PartPalette
            onInsert={(newPart: Part) => {changers.pages[0].arenas[0].layers[0].onAdd(newPart)}}
          />
        </Paper>
        <PlanEditor plan={plan} changers={changers} page={0} arena={0} selection={selection} setSelection={setSelection}/>
      </Stack>
      <Paper
        sx={{
          position: "absolute",
          right: 0,
          width: 400,
          top: 0,
          bottom: 0,
          overflow: "auto",
          display: "flex",
          flexDirection: "column"
        }}
        >
          <Select value={plan.zone}>
            {Object.keys(Zones).map(code =>
              <MenuItem key={code} value={code} onClick={() => {changers.zone(code)}}>{code}</MenuItem>
            )}
          </Select>
          <LayerEditor plan={plan} changers={changers} page={0} arena={0} selection={selection} setSelection={setSelection}/>
          <Divider/>
            {selection.values().toArray().map((id, idx) => {
              const part = findById(id);
              console.log("Tried to find part", id, "got", part);
              if(part === undefined) return <React.Fragment key={idx}>Error: can't find part {id}</React.Fragment>
              else return <PropertyEditor
                key={idx}
                byId={changers.byId}
                part={part}
              />
            })}
          <Divider/>
        <Button
          onClick={() => {setPlan(doc.plan as Plan)}}
        >
          Revert
        </Button>
        <Button
          onClick={() => {void navigator.clipboard.writeText(JSON.stringify(plan, null, 2))}}
        >
          Copy
        </Button>
          
        <pre style={{fontSize: "8pt"}}>
          {JSON.stringify(plan, null, 2)}
        </pre>
      </Paper>
    </Stack>    
  </>
}
  