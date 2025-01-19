import { Box, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography } from "@mui/material";

import { ReportActions } from "../../types";
import React from "react";
import { Action, unknownAction } from "../../excel/Action.types";


const ActionKeys = Object.keys(unknownAction) as (keyof Action)[];

function formatCell(row: Action, key: keyof Action): string | number {
  const value = row[key];
  if(value === true) return "Y";
  else if(value === false) return "n";
  else return value;
}

export default function ReportActionSummary({summary}: {summary: ReportActions}) {
  const [enc, setEnc] = React.useState(0);
  const actions = React.useMemo(() => 
    summary.encounters[enc].actions
  , [enc, summary]);
  return (<>
    <Paper sx={{m: 1, flex: 1, flexShrink: 1, overflow: "auto", display: "flex", flexDirection: "column"}}>
    <Tabs value={enc} onChange={(_, newValue) => {setEnc(newValue as number)}} aria-label="Select encounter">
      {summary.encounters.map((e, i) =>
        <Tab label={e.name} value={i}/>
      )}
    </Tabs>
    <TableContainer sx={{overflow: "auto", flex: 1}}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            {ActionKeys.map((name, i) => 
            <TableCell key={i}>{name}</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {actions.map(action => 
          <TableRow key={action.id}>
            {ActionKeys.map((key, i) => 
            <TableCell key={i}>{formatCell(action, key)}</TableCell>
            )}
          </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
  </>)
}