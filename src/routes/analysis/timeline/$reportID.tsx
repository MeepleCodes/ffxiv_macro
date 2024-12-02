import { createFileRoute } from '@tanstack/react-router'
import { Report } from '../../../fflogs/reports';
import { CastEvent } from '../../../fflogs/types';
import { Box, Button, Checkbox, Divider, FormControlLabel, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import React from 'react';
import dayjs from 'dayjs';

export const Route = createFileRoute('/analysis/timeline/$reportID')({
  component: TimelineAnalysis,
  loader: async ({params: {reportID}}) => {
    const meta = await fetch(`${import.meta.env.BASE_URL}/analysis/casts/meta.${reportID}.json`).then(resp => resp.json()) as Report;
    const casts = await fetch(`${import.meta.env.BASE_URL}/analysis/casts/casts.${reportID}.json`).then(resp => resp.json()) as CastEvent[][];
    return {meta, casts};
  }
})

export function TimelineAnalysis() {
  const {meta, casts} = Route.useLoaderData();
  const [selected, setSelected] = React.useState<readonly number[]>([]);
  const [showSide, setShowSide] = React.useState(false);
  const rows = React.useMemo(() => {
    const maxRows = Math.max(...casts.map(fight => fight.length));
    const rows = [];
    for(let i=0; i<maxRows; i++) {
      const events = casts.map(fight => fight.at(i));
      const presentEvents = events.filter(event => event !== undefined);
              
      const types = new Set(presentEvents.map(e => e.type));
      const abilities = new Set(presentEvents.map(cast => meta.abilities.find(a => a.gameID === cast.abilityGameID)));
      const times = presentEvents.map(event => event.timestamp - meta.fights[event.fight-1].startTime);
      const averageTime = times.reduce((a, b) => a+b, 0) / times.length;      
      rows.push({
        types,
        abilities,
        averageTime,
        events
      });
    }
    return rows;
  }, [casts, meta]);
  const formatTimestamp = React.useCallback((event: CastEvent) => {
    const duration = dayjs.duration(event.timestamp - meta.fights[event.fight-1].startTime);
    return duration.format("mm:ss.SSS");
  }, [meta]);

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
  
  const isSelected = (id: number) => selected.includes(id);
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
      if(usedRows[i].types.size > 1 || usedRows[i].types.has("begincast")) continue;
      const time = (usedRows[i].types.has("cast") && i > 0 && usedRows[i-1].types.has("begincast") && usedRows[i].abilities.symmetricDifference(usedRows[i-1].abilities).size == 0) ?
        `${dayjs.duration(usedRows[i-1].averageTime).format("mm:ss")}-${dayjs.duration(usedRows[i].averageTime).format("mm:ss")}` :
        dayjs.duration(usedRows[i].averageTime).format("mm:ss");
      lines.push(
        `* ${time}: ${new Array(...usedRows[i].abilities).map(ability => ability?.name ?? '<unknown>').join("/")}`
      )
    }
    return lines.join("\n");
  }, [rows, isSelected]);
  return (
    <>
      <IconButton
        sx={{position: "absolute", right: 0, m: 0.5}}
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
            {meta.fights.map(fight => 
              <TableCell key={fight.id}>
                {fight.id}
              </TableCell>
            )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => {
              const isItemSelected = isSelected(i);

              return <TableRow
                key={i}
                onClick={() => {selectRow(i)}}
                role="checkbox"
                aria-checked={isItemSelected}
                tabIndex={-1}
                selected={isItemSelected}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell sx={{textWrap: "nowrap"}}>
                  <Checkbox
                    color="primary"
                    disabled={row.types.size > 1}
                    checked={isItemSelected}
                  />
                  {row.types.size == 1 && <>
                    {!Number.isNaN(row.averageTime) && dayjs.duration(row.averageTime).format("mm:ss: ")}
                    {row.types}&nbsp;
                    {new Array(...row.abilities).map(ability => `${ability?.name} (${ability?.gameID})`).join("/")}
                  </>}
                </TableCell>              
                {row.events.map((cast, j) => 
                <TableCell key={j}>
                  {cast !== undefined && <>
                    {formatTimestamp(cast)}: {cast.type} {meta.abilities.find(a => a.gameID === cast.abilityGameID)?.name}
                  </>}
                </TableCell>
                )}
                
              </TableRow>
            }
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </Stack>
    </>
  )
}