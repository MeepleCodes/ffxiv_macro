import { createFileRoute } from '@tanstack/react-router'
import meta from './meta.json';

import { Vector2d } from 'konva/lib/types';

import * as React from 'react';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

import { visuallyHidden } from '@mui/utils';


export const Route = createFileRoute('/analysis/aacm2s/hearts')({
  component: EnhancedTable
})

type TimedLocation = {
  x: number;
  y: number;
  timestamp: number;
}
// import fight from './fight-4.json';

// const damageData = fight.reportData.report.damage.data;
// const heartsData = fight.reportData.report.hearts.data;
import allData from './hearts.json';
const {damageData, heartsData} = allData;

function closestLocation(actorId: number, timestamp: number, lerp = false): TimedLocation | null {
  let before: TimedLocation|null = null;
  let after: TimedLocation|null = null;
  for(const event of damageData) {
    let loc = null;
    if(event.sourceID == actorId && event.sourceResources !== undefined) {
      loc = {x: event.sourceResources.x, y: event.sourceResources.y, timestamp: event.timestamp};
    } else if(event.targetID == actorId && event.targetResources !== undefined) {
      loc = {x: event.targetResources.x, y: event.targetResources.y, timestamp: event.timestamp};
    } else {
      continue;
    }
    if(loc.timestamp <= timestamp) {
      if(before === null || loc.timestamp > before.timestamp) before = loc;
    } else {
      if(after === null || loc.timestamp < after.timestamp) after = loc;
    }
  }
  if(lerp) {
    if(before === null || after === null) return null;
    const alpha = (timestamp - before.timestamp) / (after.timestamp - before.timestamp);
    return {
      x: before.x * (1-alpha) + after.x * alpha,
      y: before.y * (1-alpha) + after.y * alpha,
      timestamp
    }
  } else {
    if(before === null && after === null) {
      return null;
    } else if(before === null) {
      return after;
    } else if(after === null) {
      return before;
    } else {
      return (timestamp - before.timestamp) <= (after.timestamp - timestamp) ? 
        before :
        after;
    }
  }
}

const honeyBId = meta.reportData.report.masterData.actors.filter(actor => actor.subType === "Boss")[0].id;

const playerLookup = Object.fromEntries(
  meta.reportData.report.masterData.actors.filter(
    actor => actor.type === "Player"
  ).map(actor => [
    actor.id,
    actor
  ])
);

const rows = heartsData.map((event, idx) => {
  const loc = closestLocation(event.targetID, event.timestamp, true)!;
  const bossLoc = closestLocation(honeyBId, event.timestamp, true)!;
  const bossDistance = loc !== null && bossLoc !== null ? 
    Math.sqrt(Math.pow(loc.x - bossLoc.x, 2) + Math.pow(loc.y - bossLoc.y, 2)) :
    undefined;
  const cls = playerLookup[event.targetID]?.subType;
  const role = ["Paladin", "Warrior", "Dark Knight", "Gunbreaker"].includes(cls) ? "T" : 
    ["White Mage", "Sage", "Scholar", "Astrologian"].includes(cls) ? "H" :
    ["Monk", "Viper", "Ninja", "Samurai", "Dragoon"].includes(cls) ? "M" :
    "R";
  return {
    id: idx,
    fight: event.fight,
    role: role,
    player: playerLookup[event.targetID],
    job: playerLookup[event.targetID]?.subType,
    x: loc?.x,
    y: loc?.y,
    bossDistance,
    hearts: event.abilityGameID - 1003922
  }
}).filter(row => row.hearts >= 0 && row.hearts < 3);

type Data = typeof rows[number];

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = 'asc' | 'desc';



interface Column<RowType, RowKey extends keyof RowType = keyof RowType> {
  id: RowKey;
  label: string;
  numeric: boolean;
  sortValue?: (value: RowType[RowKey], row: RowType) => string|number;
  render?: (value: RowType[RowKey], row: RowType) => React.ReactNode;
}

const columns: readonly Column<Data>[] = [
  
  {
    id: 'fight',
    numeric: false,
    label: 'Fight',
  },
  {
    id: 'player',
    numeric: false,
    label: 'Player',
    sortValue: value => value?.name,
    render: value => <Box title={value?.id}>{value?.name}</Box>
  },
  {
    id: "role",
    numeric: false,
    label: "Role",
    sortValue: value => ["T", "H", "M", "R"].indexOf(value)
  },
  {
    id: "job",
    numeric: false,
    label: "Job"
  },
  {
    id: 'x',
    numeric: true,
    label: 'X',
  },
  {
    id: 'y',
    numeric: true,
    label: 'Y',
  },
  {
    id: "bossDistance",
    numeric: true,
    label: "Distance from boss"
  },
  {
    id: "hearts",
    numeric: true,
    label: "Hearts"
  }
];

interface EnhancedTableProps {
  onRequestSort: (event: React.MouseEvent<unknown>, colSpec: Column<Data>) => void;
  order: Order;
  orderBy: Column<Data>;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { order, orderBy, onRequestSort } =
    props;
  const createSortHandler = (colSpec: Column<Data>) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, colSpec);
    };

  return (
    <TableHead>
      <TableRow>
        {columns.map((colSpec) => (
          <TableCell
            key={colSpec.id}
            align={colSpec.numeric ? 'right' : 'left'}
            sortDirection={orderBy === colSpec ? order : false}
          >
            <TableSortLabel
              active={orderBy === colSpec}
              direction={orderBy === colSpec ? order : 'asc'}
              onClick={createSortHandler(colSpec)}
            >
              {colSpec.label}
              {orderBy === colSpec ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}


export default function EnhancedTable() {
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<Column<Data>>(columns[1]);

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    colSpec: Column<Data>,
  ) => {
    const isAsc = orderBy === colSpec && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(colSpec);
  };



// only support modern browsers you can replace stableSort(exampleArray, exampleComparator)
// with exampleArray.slice().sort(exampleComparator)    
  const visibleRows = React.useMemo(
    () =>
      rows.slice().sort((a: Data, b: Data) => {
        const getter = orderBy.sortValue ?? ((value, _) => value ?? 0 as number | string);
        if(order === 'desc') {
          if(a.fight !== b.fight) return a.fight - b.fight;
          else if(getter(a[orderBy.id], a) < getter(b[orderBy.id], b)) return 1;
          else return -1;
        } else {
          if(a.fight !== b.fight) return a.fight - b.fight;
          else if(getter(a[orderBy.id], a) < getter(b[orderBy.id], b)) return -1;
          else return 1;
        }
      }),
    [order, orderBy],
  );

  return (
    <Box sx={{ width: '100%', maxHeight: "90vh", overflow: "auto" }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size='small'
          >
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
            />
            <TableBody>
              {visibleRows.map((row, index) => {
                return (
                  <TableRow
                    hover
                    tabIndex={-1}
                    key={row.id}
                  >
                    {columns.map(col => 
                      <TableCell
                        align={col.numeric ? "right" : "left"}
                        >
                        {(col.render ?? (x => x))(row[col.id], row)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
             
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}