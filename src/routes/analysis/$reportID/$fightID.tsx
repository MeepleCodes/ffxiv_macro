import { createFileRoute } from '@tanstack/react-router'

import Replay from '../../../components/analysis/Replay'

import { fetchFight } from '../../../supabase/fetch';

export const Route = createFileRoute('/analysis/$reportID/$fightID')({
  component: FightRoot,
  loader: async ({params: {reportID, fightID}}) => {console.log(reportID, fightID); return fetchFight(parseInt(reportID), parseInt(fightID))},
  // staleTime: 300_000
})

function FightRoot() {
  const report = Route.parentRoute.useLoaderData();
  const {fightID} = Route.useParams();
  const fight = Route.useLoaderData();
  // const [timestamp, setTimestamp] = React.useState(-1);

  return (
      <Replay
        report={report}
        fight={fight}
      />
    
  )
}