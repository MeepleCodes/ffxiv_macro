import { createFileRoute } from '@tanstack/react-router'
import React from 'react';
import supabase from '../../supabase/client';
import { Box, Button,  Checkbox,  FormControl,  FormControlLabel,  LinearProgress,  List,  ListItem,  ListItemText,  Paper, Stack, TextField, Typography } from '@mui/material';
import { fetchCurrentUser, User } from '../../fflogs/user.v2';
import { RouteLink } from '../../components/Links';

export const Route = createFileRoute('/analysis/import')({
  component: AnalysisImport
})

type Result<T> = {
  error: string,
  details?: unknown
} | {
  success: true,
  data: T
};

type ReportResult = Result<{
  report_id: number,
  actors: number,
  fights: number
}>;

type FightResult = Result<{
  totalEvents: number,
  actions: number,
  locators: number
}>;

async function maybeFetchFight(reportCode: string, fightNumber: number, allFights: boolean): Promise<FightResult | null> {
  if(!allFights) {
    const eventCount = await supabase
      .from("fight_events")
      .select("*, report_fights(fight_number, reports(code))", {count: "exact"})
      .eq("report_fights.reports.code", reportCode)
      .eq("report_fights.fight_number", fightNumber);
    if(eventCount.error !== null) throw eventCount.error;
    if(eventCount.count !== null && eventCount.count > 0) {
      return {
        success: true,
        data: {
          totalEvents: eventCount.count,
          actions: 0,
          locators: 0
        }
      }
    }
  }
  console.log("(Re)fetching fight", reportCode, fightNumber);
  return supabase.rpc(
    "import_fflogs_fight",
    {report_code: reportCode, fight_number: fightNumber}
  ).then(({error, data}) => {
    if(error !== null) {
      throw error;
    } else {
      return data as FightResult;
    }
  });
}

function AnalysisImport() {
  const [allFights, setAllFights] = React.useState(false);
  const [reportResult, setReportResult] = React.useState<ReportResult|null>(null);
  // Null if no import is in progress; individual entries will be null if that fight hasn't finished yet
  const [fightResults, setFightResults] = React.useState<Array<FightResult|null>|null>(null);
  const [reportCode, setReportCode] = React.useState("");
  const [error, setError] = React.useState("");
  function startImport() {
    if(reportCode === "") return;
    try {
      supabase.rpc("import_fflogs_report", {report_code: reportCode}).then(
        (value) => {
          if(value.error !== null) throw value.error;
          const result = value.data as ReportResult;
          setReportResult(result);
          if("error" in result) throw new Error(result.error);
          setFightResults(new Array(result.data.fights).fill(null) as Array<FightResult|null>);
          const fightQueries = [];
          for(let i=0; i<result.data.fights; i++) {
            const fightNumber = i+1;
            fightQueries.push(
              maybeFetchFight(reportCode, fightNumber, allFights)
                .then( fightResult => {
                  setFightResults((old) => {
                    const newResults = old === null ? new Array(result.data.fights).fill(null) as Array<FightResult|null> : [...old];
                    newResults[fightNumber-1] = fightResult;
                    return newResults;
                  });
                })
            )
          }
          return Promise.all(fightQueries);
        },
        (e: unknown) => {
          setError(String(e));
        }
      );
    } catch (e: unknown) {
      setError(String(e));
    }
  }
  const variant = reportResult !== null && fightResults === null ? "indeterminate" : "determinate";
  const progress = fightResults === null ? 0 : (fightResults.filter(r => r !== null).length * 100 / fightResults.length);
  return <>
    <Box sx={{m: 1, flex: 1, display: "flex", alignItems: "center", justifyContent: "center"}}>
      <Paper sx={{width: "600px", height: "200px"}}>
        <Stack direction="row" sx={{p: 2}}>
          <TextField onChange={(e) => {setReportCode(e.target.value)}} value={reportCode} label="FFLogs report code"/>
          <FormControlLabel
            control={
              <Checkbox checked={allFights} onChange={(_, checked) => {setAllFights(checked)}}/>
            }
            label="Re-fetch existing fight data"
          />
          <Button onClick={startImport} disabled={reportCode === ""}>Import</Button>
        </Stack>
        {error !== "" ? <>
          {error}
          <br/>
          <RouteLink to={Route.to} search={{}}>Try again</RouteLink>
        </> : <>
          <LinearProgress variant={variant} value={progress}/>
          { fightResults !== null && (
              reportResult === null ?
                  'Fetching report data' :
                  `Fetching fight events (${fightResults.filter(r => r !== null).length}/${fightResults.length})`
              )
          }
        </>
        }
      </Paper>
    </Box>
  </>
}
