import { Button, Divider, Paper, Stack } from "@mui/material";

import { PlanDoc, planStore } from "../../supabase/Plans"
import React, { SetStateAction } from "react";
import DocToolbar from "../DocToolbar";
import { Part, Plan } from "./schemas";
import { useEditablePlan } from "./types";
import PlanEditor from "./PlanEditor";
import { ColourPresets } from "./presets";
import PartPalette from "./PartPalette";

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
              name: "Layer 1",
              visible: true,
              parts: [
                {
                  id: "1",
                  name: "",
                  type: "aoecircle",
                  x: 100,
                  y: 100,
                  colour: ColourPresets.Red,
                  opacity: 1,
                  radius: 6,
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
  const {plan, changers} = useEditablePlan(liveDoc.plan as Plan);
  
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
        <PlanEditor plan={plan} changers={changers} page={0} arena={0}/>
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
  