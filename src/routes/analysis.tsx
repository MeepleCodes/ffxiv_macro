import {  Paper, Stack, tabClasses, Tabs, tabsClasses } from '@mui/material'
import { createFileRoute, useMatchRoute } from '@tanstack/react-router'
import { TabLink } from '../components/Links'
import { Outlet } from '@tanstack/react-router';
import { fetchIndex } from '../analysis/fetch';
import dayjs from 'dayjs';

export const Route = createFileRoute('/analysis')({
  loader: async () => fetchIndex(),
  staleTime: 300_000,
  component: AnalysisRoot
})

function AnalysisRoot() {
  const reports = Route.useLoaderData();
  const matchRoute = useMatchRoute();
  return <>
    <Stack direction="row" alignSelf="stretch" overflow="hidden" height="100%">
    <Paper square elevation={4}>
      <Tabs
    value={reports.find(report => matchRoute({to: "/analysis/$reportID", params: {reportID: report.code}, fuzzy: true}))?.code ?? false}
    variant="scrollable"
    orientation="vertical"
    sx={{
      writingMode: "vertical-rl",
      overflow: "auto",
      
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
    {reports.map(report => 
      <TabLink
        to="/analysis/$reportID"
        params={{reportID: report.code}}
        value={report.code}
        key={report.code}
        label={dayjs(report.startTime).format("MMM DD YY")}
      />
    )}
  </Tabs>
  </Paper>
  <Outlet/>
  </Stack>
  </>
}
