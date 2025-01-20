import React from "react";
import { Sort, Store, UserDoc, useWatchOwnDocs } from "../supabase/UserDocStore"
import { Divider, InputAdornment, InputBase, Paper, Stack, IconButton, StackProps, Box } from "@mui/material";
import ModeMenu, { Mode } from "./ModeMenu";

import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

export type DisplayModeComponentProps<OwnFields> = {
  docs: UserDoc<OwnFields>[]
}

export type DisplayMode<OwnFields> = Mode & {
  component: React.FunctionComponent<DisplayModeComponentProps<OwnFields>>
}

export type SortMode<OwnFields> = Mode & {
  sortOrder: Sort<OwnFields> | undefined
}

export type DocListProps<OwnFields> = StackProps & {
  store: Store<OwnFields>,
  displayModes: [DisplayMode<OwnFields>, ...DisplayMode<OwnFields>[]],
  defaultDisplay?: DisplayMode<OwnFields>,
  sortModes: SortMode<OwnFields>[],
  defaultSort?: SortMode<OwnFields>
}

export default function DocList<OwnFields>(props: DocListProps<OwnFields>) {
  const { store, displayModes, defaultDisplay, sortModes, defaultSort, ...rest } = props;
  const [displayMode, setDisplayMode] = React.useState(defaultDisplay ?? displayModes[0]);
  const [sortMode, setSortMode] = React.useState<SortMode<OwnFields> | undefined>(defaultSort ?? sortModes[0]);
  const [filterText, setFilterText] = React.useState("");
  const sortOrder = React.useMemo(() => {
    return sortMode?.sortOrder === undefined ? [] : [sortMode.sortOrder]
  }, [sortMode]);
  const docs = useWatchOwnDocs(store, sortOrder, false, filterText);
  return (
    <Stack sx={{ height: "100%" }} spacing={0} {...rest}>
      <Paper
        sx={{
          p: 0.5,
          m: 0.5,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <InputBase
          placeholder="Filter..."
          sx={{ ml: 1, flex: 1 }}
          value={filterText}
          onChange={(e) => {setFilterText(e.target.value)}}
          startAdornment={
            <InputAdornment
              position="start"
              disablePointerEvents
            >
              <SearchIcon />
            </InputAdornment>
          }
          endAdornment={
            filterText === "" ?
              undefined :
              <InputAdornment
                position="end"
              >
                <IconButton
                  onClick={() => {setFilterText("")}}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>}
        />
        <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
        {sortMode !== undefined && <ModeMenu
          color="primary"
          modes={sortModes}
          mode={sortMode}
          setMode={setSortMode}
          title="Sort order"
        />}
        <ModeMenu
          color="primary"
          modes={displayModes}
          mode={displayMode}
          setMode={setDisplayMode}
          title="Display as..."
        />
      </Paper>
      <Box sx={{overflow: "auto"}}>
        <displayMode.component docs={docs}/>
      </Box>
    </Stack>
  )
}