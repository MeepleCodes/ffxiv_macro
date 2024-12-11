import { Box, List, ListItem, ListItemButton, ListItemText, Paper, Stack } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router'
import { Report } from '../../../fflogs/reports';
import React from 'react';

export const Route = createFileRoute('/analysis/$reportID/')({
  component: ReportIndex,
  staleTime: 300_000
})

function ReportIndex() {
  const meta = Route.parentRoute.useLoaderData();
  const properties = ["fights", "actors", "abilities"] as const;
  const labels = Object.fromEntries(properties.map(property => [property, property[0].toUpperCase() + property.slice(1)])) as Record<keyof Report, string>;
  const [section, setSection] = React.useState<typeof properties[number] | null>(null);
  return (
    <Paper sx={{m: 2, flex: 1, alignSelf: "stretch", display: "flex", overflow: "hidden"}}>
      <List subheader="Report properties">
        {properties.map(property => 
          <ListItemButton
            key={property}
            onClick={() => {setSection(property)}}
          >
            <ListItemText
              primary={labels[property]}
              secondary={`${meta[property].length}`}
              />
          </ListItemButton>

        )}
      </List>
      <Box sx={{flex: 1, overflow: "hidden"}}>
        {section !== null && 
        <List subheader={labels[section]} dense sx={{overflow: "auto", height: "100%"}}>
          {meta[section].map((value, i) => 
            <ListItem key={`${section}-${i}`}>
              {JSON.stringify(value)}
            </ListItem>
          )}
        </List>}
      </Box>
      </Paper>
  )
}