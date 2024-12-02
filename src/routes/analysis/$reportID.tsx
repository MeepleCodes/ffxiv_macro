import { Box, List, ListItem, ListItemText } from '@mui/material';
import { createFileRoute, Outlet, useMatchRoute } from '@tanstack/react-router'
import { ListItemButtonLink } from '../../components/ListItemButtonLink';
import dayjs from 'dayjs';
import { AnalysisNav } from '../-AnalysisNav';
import { fetchMeta } from '../../fflogs/fetch';

export const Route = createFileRoute('/analysis/$reportID')({
  loader: async ({params: {reportID}}) => fetchMeta(reportID),
  staleTime: 300_000,
  component: ReportRoot
})

function ReportRoot() {
  const {reportID} = Route.useParams();
  const reports = Route.parentRoute.useLoaderData();
  const meta = Route.useLoaderData();
  const matchRoute = useMatchRoute();
  return (<>
      <AnalysisNav
        reports={reports}
        sx={{
          ["&:hover .MuiList-root"]: {
            width: 200,
            transition: (theme) => theme.transitions.create(['width'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            })
          }
        }}
      >
        <List
          dense
          sx={{
            overflow: "auto",
            flexShrink: 0,
            width: 64,
            transition: (theme) => theme.transitions.create(['width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            })            
          }}
          >
          {meta.fights.map((fight, idx) => {
            const toParams = {reportID, fightID: `${idx+1}`};
            return <ListItem disablePadding dense key={idx}>
                <ListItemButtonLink
                to="/analysis/$reportID/$fightID"
                params={toParams}
                key={idx}
                selected={matchRoute({to: "/analysis/$reportID/$fightID", params: toParams, fuzzy: true}) !== false}
                >
                  <Box sx={{width: (theme) => theme.spacing(2), mr: (theme) => theme.spacing(2), flexShrink: 0, textAlign: "center"}}>{idx+1}</Box>
                  <ListItemText
                    primary={fight.name}
                    primaryTypographyProps={{noWrap: true}}
                    secondary={`${dayjs.duration(fight.combatTime, "milliseconds").format("mm:ss")} ${fight.bossPercentage}%`}
                    secondaryTypographyProps={{noWrap: true}}
                    />
              </ListItemButtonLink>
            </ListItem>
          }
          )}
        </List>
      </AnalysisNav>
      <Outlet/>
      </>
  )
}