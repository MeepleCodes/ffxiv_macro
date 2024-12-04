import { createFileRoute } from '@tanstack/react-router'
import { Plan } from '../../components/plans/plans';
import PlanView from '../../components/plans/PlanView';
import React from 'react';
import { Button, Paper } from '@mui/material';

async function loadPlan(planID: string): Promise<Plan> {
  const {default: imported} = await import(`./plan-${planID}.json`) as {default: Plan};
  return imported;
}
export const Route = createFileRoute('/plan/$planID')({
  loader: async ({params: {planID}}) => loadPlan(planID),
  // staleTime: 300_000,
  component: PlanRoot,
});

function PlanRoot() {
  const initialPlan = Route.useLoaderData();
  const {planID} = Route.useParams();
  console.log("Loaded plan", planID, "as", initialPlan);
  const [plan, setPlan] = React.useState(initialPlan);
  return <>
    <PlanView {...{plan, setPlan}}/>
    <Paper
      sx={{
        position: "absolute",
        right: 0,
        width: 400,
        top: 0,
        bottom: 0,
        overflow: "auto"
      }}
      >
      <Button
        onClick={() => {setPlan(initialPlan)}}
      >
        Revert
      </Button>
      <Button
        onClick={() => {void navigator.clipboard.writeText(JSON.stringify(plan, null, 2))}}
      >
        Copy
      </Button>
        
      <pre>
        {JSON.stringify(plan, null, 2)}
      </pre>
    </Paper>
      
  </>
}