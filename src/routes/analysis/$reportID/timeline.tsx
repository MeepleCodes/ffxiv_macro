import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Box, Button, Checkbox, FormControlLabel, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableRowProps } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';

import { fetchFightData, fetchMeta } from '../../../fflogs/fetch';
import React from 'react';
import { CastEvent } from '../../../fflogs/types';
import { Report, ReportAbility } from '../../../fflogs/reports';
import { RouteLink } from '../../../components/Links';

async function fetchFights(reportID: string) {
  const report = await fetchMeta(reportID);
  return await Promise.allSettled(
    report.fights.map(
      fight => fetchFightData(reportID, `${fight.id}`)
    )
  ).then(
    promises => 
      promises
        .filter(promise => promise.status == 'fulfilled')
        .map(promise => promise.value)
  );
}
type TimelineSearch = {
  excludeFights?: number[],
  dontMerge?: number[],
  ignore?: number[]
};

function toggle(prev: number[]|undefined, value: number): number[] {
  return [...new Set<number>(prev ?? []).symmetricDifference(new Set<number>([value]))]
}

export const Route = createFileRoute('/analysis/$reportID/timeline')({
  loader: async ({params: {reportID}}) => fetchFights(reportID),
  validateSearch: (search: Record<string, unknown>): TimelineSearch => {
    // validate and parse the search params into a typed state
    return {
      excludeFights: Array.isArray(search.excludeFights) ? search.excludeFights.map(Number) : [],
      dontMerge: Array.isArray(search.dontMerge) ? search.dontMerge.map(Number) : [],
      ignore: Array.isArray(search.ignore) ? search.ignore.map(Number) : [],
    }
  },
  staleTime: 300_000,
  component: Timeline
})

type MultiCast = CastEvent & {
  hitCount: number
}

type RowData = {
  abilities: (ReportAbility & { hitCount: number})[],
  averageTime: number,
  events: (MultiCast | undefined)[]
};

function Timeline() {
  const meta = Route.parentRoute.useLoaderData();
  const fights = Route.useLoaderData();
  const {excludeFights, dontMerge, ignore} = Route.useSearch();
  const casts = React.useMemo(() => 
    fights.map(
      (fight, i) => {
        if(excludeFights?.includes(i) === true) {
          return [];
        }
        const out: MultiCast[] = [];
        for(const event of fight.events) {
          if(event.type === "cast" && ignore?.includes(event.abilityGameID) !== true) {
            const last = out.at(-1);
            if(dontMerge?.includes(event.abilityGameID) !== true && last?.abilityGameID === event.abilityGameID && last.sourceID === event.sourceID && Math.abs(last.timestamp-event.timestamp) < 10) {
              last.hitCount++;
            } else {
              out.push({
                ...event as CastEvent,
                hitCount: 1
              })
            }
          }
        }
        return out;
      }
    ), [fights, excludeFights, dontMerge, ignore]
  );

  const [selected, setSelected] = React.useState<readonly number[]>([]);
  const [showSide, setShowSide] = React.useState(false);
  
  const rows = React.useMemo(() => {
    const maxRows = Math.max(...casts.map(fight => fight.length));
    const rows = [];
    for(let i=0; i<maxRows; i++) {
      const events = casts.map(fight => fight.at(i));
      const presentEvents = events.filter(event => event !== undefined);
      // Can't use a set any more because we need hitcount variations
      const abilities: (ReportAbility & {hitCount: number})[] = [];
      for(const event of presentEvents) {
        if(abilities.findIndex(ability => ability.hitCount === event.hitCount && ability.gameID === event.abilityGameID) === -1) {
          const ability = meta.abilities.find(a => a.gameID === event.abilityGameID);
          if(ability !== undefined) {
            abilities.push({
              ...ability,
              hitCount: event.hitCount
            })
          }
        }
      }
      const times = presentEvents.map(event => event.timestamp - meta.fights[event.fight-1].startTime);
      const averageTime = times.reduce((a, b) => a+b, 0) / times.length;      
      rows.push({
        abilities,
        averageTime,
        events
      });
    }
    return rows;
  }, [casts, meta]);


  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = rows.map((_, i) => i);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const selectRow = (idx: number) => {
    const selectedIndex = selected.indexOf(idx);
    let newSelected: readonly number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, idx);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };
  
  const isSelected = React.useCallback(
    (id: number) => selected.includes(id),
    [selected]
  );
  const uncheckUnknowns = () => {
    setSelected(selected.filter(idx => {
      let allKnown = true;
      for(const ability of rows[idx].abilities) {
        if(ability === undefined || ability.name.startsWith("unknown")) {
          allKnown = false;
          break;
        }
      }
      return allKnown;
    }));
  }
  const numSelected = selected.length;
  const asText = React.useMemo(() => {
    const lines = [] as string[];
    const usedRows = rows.filter((_, i) => isSelected(i));
    for(let i=0; i<usedRows.length; i++) {
      const time = dayjs.duration(usedRows[i].averageTime).format("mm:ss");
      lines.push(
        `* ${time}: ${new Array(...usedRows[i].abilities).map(ability => ability?.name ?? '<unknown>').join("/")}`
      )
    }
    return lines.join("\n");
  }, [rows, isSelected]);
  return (
    <Paper sx={{width: "90vw", height: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative"}}>
      <IconButton
        sx={{position: "absolute", right: 0, m: 0.5, zIndex: 1000}}
        color="primary"
        onClick={() => {setShowSide(!showSide)}}
        >
        {showSide ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
      </IconButton>
      <Stack direction="row-reverse" sx={{overflow: "hidden"}} spacing={1}>
        {showSide  && <>
          
          <Box sx={{width: 200}}>
            <textarea value={asText}/>
          </Box>
        </>}
      <TableContainer sx={{flex: 1, overflow: "auto", "& .MuiTableCell-head": {background: (theme) => theme.palette.background.paper}}}>
        <Table stickyHeader size='small'>
          <TableHead>
            <TableRow>
            <TableCell padding="checkbox">
              <Stack direction="row">
                <FormControlLabel
                  sx={{flex: 1}}
                  control={
                    <Checkbox
                      color="primary"
                      indeterminate={numSelected > 0 && numSelected < rows.length}
                      checked={rows.length > 0 && numSelected === rows.length}
                      onChange={handleSelectAllClick}
                      inputProps={{
                        'aria-label': 'select all',
                      }}
                    />
                  }
                  label="Select all"
                />
              <Button
                onClick={uncheckUnknowns}
              >
                Remove unknowns
                </Button>
              </Stack>
            </TableCell>
            {meta.fights.map((fight, i) => 
              <TableCell key={fight.id}>
                <RouteLink search={(prev) => ({...prev, excludeFights: toggle(prev.excludeFights, i)})} from={Route.fullPath}>{fight.id}</RouteLink>
              </TableCell>
            )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => 
              <TimelineRow
                onClick={() => {selectRow(i)}}

                aria-checked={isSelected(i)}
                selected={isSelected(i)} 
                {...{row, meta}}
              />
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </Stack>
    </Paper>
  )
}

const TimelineRow = React.memo(function TimelineRow(props: {row: RowData, meta: Report} & TableRowProps) {
  const {row, meta} = props;
  const formatTimestamp = React.useCallback((event: CastEvent) => {
    const duration = dayjs.duration(event.timestamp - meta.fights[event.fight-1].startTime);
    return duration.format("mm:ss.SSS");
  }, [meta]);
  return <TableRow
    role="checkbox"
    tabIndex={-1}
    
    sx={{ cursor: 'pointer' }}
  >
    <TableCell sx={{textWrap: "nowrap"}}>
      <Checkbox
        color="primary"
        checked={props.selected}
      />
      
      {!Number.isNaN(row.averageTime) && dayjs.duration(row.averageTime).format("mm:ss: ")}
      &nbsp;
      {row.abilities.map(ability => `${ability?.name} (${ability?.gameID})${ability.hitCount == 1 ? '' : ` x${ability.hitCount}`}`).join("/")}
    
    </TableCell>              
    {row.events.map((cast, j) => 
    <TableCell key={j}>
      {cast !== undefined && <>
      
        {formatTimestamp(cast)}: {meta.abilities.find(a => a.gameID === cast.abilityGameID)?.name} {cast.hitCount > 1 && ` x${cast.hitCount}`}
        (<RouteLink from={Route.fullPath} search={(prev) => ({...prev, dontMerge: toggle(prev.dontMerge, cast.abilityGameID)})}>don't merge
        </RouteLink>)
        (<RouteLink from={Route.fullPath} search={(prev) => ({...prev, ignore: toggle(prev.ignore, cast.abilityGameID)})}>ignore
        </RouteLink>)
        </>
      }
    </TableCell>
    )}
    
  </TableRow>
});