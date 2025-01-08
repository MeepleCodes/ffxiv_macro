import { Box, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { Action, ActionKeys } from "../../excel/Action";

import { ReportActions } from "../../analysis/types";


function formatCell(row: Action, key: typeof ActionKeys[number]): string | number {
  if(key === "") return "";
  const value = row[key];
  if(value === true) return "Y";
  else if(value === false) return "n";
  else return value;
}

export default function ReportActionSummary({summary}: {summary: ReportActions}) {
  return (<>
    <Paper sx={{m: 2, ml: 16, flex: 1, flexShrink: 1, maxHeight: (theme) => `calc(100vh - ${theme.spacing(4)})`, overflow: "auto"}}>
      <Stack direction="column">
      {summary.encounters.map((encounter, i) => 
        <Box key={`${encounter.name}-${i}`}>
          <Typography variant="h6">{encounter.name}</Typography>
          <TableContainer sx={{maxHeight: 500, overflow: "auto"}}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {ActionKeys.map((name, i) => 
                  <TableCell key={i}>{name}</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {encounter.actions.map(action => 
                <TableRow key={action["#"]}>
                  {ActionKeys.map((key, i) => 
                  <TableCell key={i}>{formatCell(action, key)}</TableCell>
                  )}
                </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      </Stack>
    </Paper>
  </>)
}