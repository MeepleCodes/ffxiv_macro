import { createFileRoute, createLink, Outlet, useMatchRoute } from '@tanstack/react-router'
import { Box, Paper, Tab, Tabs } from '@mui/material';

export const Route = createFileRoute('/analysis/timeline')({
  component: BeesParent,
});

const TabLink = createLink(Tab);

function BeesParent() {
  const reportIDs = ["Yc98LCA3vQdPnBFw"];
  const matchRoute = useMatchRoute();
  
  return <>
    <Paper sx={{width: "90vw", height: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative"}}>
      <Tabs value={reportIDs.find(reportID => matchRoute({to: "/analysis/timeline/$reportID", params: {reportID}})) ?? false}>
        {reportIDs.map(reportID => 
          <TabLink
            to="/analysis/timeline/$reportID"
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
