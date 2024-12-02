import { createFileRoute } from '@tanstack/react-router'

import aacm1s from "../aacm1s/aacm1.jpg";
import aacm2s from "../aacm2s/aacm2.jpg";
import Replay from '../../../components/analysis/Replay'
import { fetchFightData } from '../../../fflogs/fetch'
import React from 'react';
import { fightTs } from '../aacm2s/bees/-utils';

export const Route = createFileRoute('/analysis/$reportID/$fightID')({
  component: FightRoot,
  loader: async ({params: {reportID, fightID}}) => fetchFightData(reportID, fightID),
  staleTime: 300_000
})

function FightRoot() {
  const meta = Route.parentRoute.useLoaderData();
  const {fightID} = Route.useParams();
  const fight = meta.fights.find(fight => fight.id === parseInt(fightID, 10));
  const {events, locator, actions} = Route.useLoaderData();
  // const [timestamp, setTimestamp] = React.useState(-1);

  if(fight === undefined) {
    return <>Failed to find fight ID ${fightID} in metadata</>
  }

  return (
      <Replay
        actions={actions}
        locator={locator}
        events={events}
        meta={meta}
        fight={fight}
      />
    
  )
}