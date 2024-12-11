import React from "react";
import { Drawer, DrawerProps, Stack, tabClasses, Tabs, tabsClasses } from '@mui/material'
import { TabLink } from '../components/Links'
import { useMatchRoute } from "@tanstack/react-router";
import { ReportIndex } from "../fflogs/reports";
import dayjs from "dayjs";


export function AnalysisNav({reports, children, ...rest}: DrawerProps & {reports: ReportIndex[]}) {
  const matchRoute = useMatchRoute();
  return (
    <Drawer {...rest} open={true} variant="permanent">
      <Stack direction="row" sx={{overflow: "hidden"}}>
      <Tabs
          value={reports.find(report => matchRoute({to: "/analysis/$reportID", params: {reportID: report.code}, fuzzy: true}))?.code ?? false}
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
        {children}
        </Stack>
    </Drawer>  
  )
}