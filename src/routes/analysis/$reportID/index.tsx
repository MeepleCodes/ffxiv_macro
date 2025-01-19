import { Box, List, ListItem, ListItemButton, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router'
import { Report } from '../../../fflogs/reports';
import React from 'react';
import { fetchReport } from '../../../supabase/fetch';
import ReportCard from '../../../components/analysis/ReportCard';

export const Route = createFileRoute('/analysis/$reportID/')({
  component: ReportIndex,
})

function ReportIndex() {
  const report = Route.parentRoute.useLoaderData();
  return (
    <Box sx={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      alignContent: "center",
      justifyContent: "center"
    }}
    >
    <Paper sx={{p: 1}}>
      <ReportCard report={report}/>
    </Paper>
    </Box>
  )
}