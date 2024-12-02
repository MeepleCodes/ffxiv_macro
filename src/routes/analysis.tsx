import { Drawer, Paper, Stack, tabClasses, Tabs, tabsClasses } from '@mui/material'
import { createFileRoute, useMatchRoute } from '@tanstack/react-router'
import { TabLink } from '../components/TabLink'
import { Outlet } from '@tanstack/react-router';
import { useExtraOutlet } from '../components/extra-outlet';
import { fetchIndex } from '../fflogs/fetch';

export const Route = createFileRoute('/analysis')({
  loader: async () => fetchIndex(),
  staleTime: 300_000,
})


function Report() {
  const reports = Route.useLoaderData();
  const matchRoute = useMatchRoute();
  const {ExtraOutlet, Provider} = useExtraOutlet();
  return (<>
    <Drawer sx ={{width: 200}} open={true} variant="permanent">
      <Stack direction="row" sx={{overflow: "hidden"}}>
      <Tabs
          value={reports.find(reportID => matchRoute({to: "/analysis/$reportID", params: {reportID}, fuzzy: true})) ?? false}
          variant="scrollable"
          orientation="vertical"
          sx={{
            writingMode: "vertical-rl",
            
            [`& .${tabsClasses.flexContainerVertical}`]: {
              flexDirection: "row",
              [`& .${tabClasses.root}`]: {
                minWidth: "48px",
                minHeight: "90px",
                transform: "rotate(180deg)"
              }
            }
          }}
          >
          {reports.map(reportID => 
            <TabLink
              to="/analysis/$reportID"
              params={{reportID}}
              value={reportID}
              key={reportID}
              label={reportID}
            />
          )}
        </Tabs>
        <ExtraOutlet/>
        </Stack>
    </Drawer>
    <Provider>
        <Outlet/>
    </Provider>
    </>
  )
}