import { createFileRoute, createLink, Outlet, useMatchRoute } from '@tanstack/react-router'
import { List, ListItemButton, ListItemText, Stack } from '@mui/material';
import { BeeEvent } from './bees.types';
import { Report } from '../../../../fflogs/reports';
import { LocationSaveData, Locator } from '../../../../fflogs/locator';
import { ListItemButtonLink } from '../../../../components/Links';

export const Route = createFileRoute('/analysis/aacm2s/bees/$reportID')({
  component: Bees,
  loader: async ({params: {reportID}}) => {
    const events = await fetch(`${import.meta.env.BASE_URL}/analysis-data/aacm2s/bees/beeCasts.${reportID}.json`).then(resp => resp.json()) as AllBeeEvents;
    const meta = await fetch(`${import.meta.env.BASE_URL}/analysis-data/aacm2s/meta.${reportID}.json`).then(resp => resp.json()) as Report;
    const locations = await fetch(`${import.meta.env.BASE_URL}/analysis-data/aacm2s/bees/locations.${reportID}.json`).then(resp => resp.json()) as LocationSaveData[];
    const locators = locations.map(location => Locator.fromSaveData(location));
    return {events, meta, locators};
  }
});

type AllBeeEvents = {
  firstWave: BeeEvent[];
  secondWave: BeeEvent[];
}[];


function Bees() {
  const {reportID} = Route.useParams();
  const {events} = Route.useLoaderData();
  const matchRoute = useMatchRoute();
  return <>
    <Stack direction="row" sx={{overflow: "hidden"}}>
      <List sx={{overflow: "auto", flexShrink: 0}}>
        {events.map((fight, idx) => ({fight, idx})).filter(({fight: {firstWave}}) => firstWave.length > 0).map(({fight, idx}) => {
          const toParams = {reportID, fightID: `${idx+1}`};
          return <ListItemButtonLink
            
            to="/analysis/aacm2s/bees/$reportID/$fightID"
            params={toParams}
            key={idx}
            selected={matchRoute({to: "/analysis/aacm2s/bees/$reportID/$fightID", params: toParams}) !== false}
            >
              <ListItemText
                primary={`Fight ${idx + 1}`}
                secondary={`${fight.firstWave.length} casts`}
                />
          </ListItemButtonLink>
        }
        )}
      </List>
      <Outlet/>
    </Stack>
  </>
}
