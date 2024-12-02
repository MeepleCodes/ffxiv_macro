import { createFileRoute, createLink, Outlet, useMatchRoute } from '@tanstack/react-router'
import { Paper, Tab, Tabs } from '@mui/material';

export const Route = createFileRoute('/analysis/aacm2s/bees')({
  component: BeesParent,
});

const TabLink = createLink(Tab);

function BeesParent() {
  const reportIDs = ["Yc98LCA3vQdPnBFw", "BNgWFPxt97Q3pkJv"];
  const matchRoute = useMatchRoute();
  
  return <>
    <Paper sx={{width: "90vw", height: "90vh", overflow: "hidden", display: "flex", flexDirection: "column"}}>
      <Tabs value={reportIDs.find(reportID => matchRoute({to: "/analysis/aacm2s/bees/$reportID", params: {reportID}, fuzzy: true})) ?? false}>
        {reportIDs.map(reportID => 
          <TabLink
            to="/analysis/aacm2s/bees/$reportID"
            params={{reportID}}
            value={reportID}
            key={reportID}
            label={reportID}
          />
        )}
      </Tabs>
      <Outlet/>
    </Paper>
  </>
}
