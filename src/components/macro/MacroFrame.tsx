import { Outlet } from '@tanstack/react-router'
import MenuIcon from '@mui/icons-material/Menu';
import React from 'react'
import { Box, IconButton } from '@mui/material'
import { Sidebar } from '../Sidebar'
import DocList, { DisplayMode, SortMode } from '../DocList'
import { MacroFields, macroStore } from '../../firebase/store/Macro'
import ListList from './MacroListList'
import PreviewList from './MacroListPreview'

import SortAlphabeticalAscending from 'mdi-material-ui/SortAlphabeticalAscending';
import SortAlphabeticalDescending from 'mdi-material-ui/SortAlphabeticalDescending';
import SortClockAscendingOutline from 'mdi-material-ui/SortClockAscendingOutline';
import SortClockDescendingOutline from 'mdi-material-ui/SortClockDescendingOutline';
import SortVariantOff from 'mdi-material-ui/SortVariantOff';

import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import ViewListIcon from '@mui/icons-material/ViewList';



const sortModes: SortMode<MacroFields>[] = [
  {name: "Unsorted", icon: <SortVariantOff/>, sortOrder: undefined},
  {name: "Name", icon: <SortAlphabeticalAscending/>, sortOrder: {key: "name", direction: "asc"}},
  {name: "Name (reversed)", icon: <SortAlphabeticalDescending/>, sortOrder: {key: "name", direction: "desc"}},
  {name: "Newest first", icon: <SortClockAscendingOutline/>, sortOrder: {key: "updated", direction: "desc"}},
  {name: "Oldest first", icon: <SortClockDescendingOutline/>, sortOrder: {key: "updated", direction: "asc"}},
] as const;

const MacroDisplayPreviews: DisplayMode<MacroFields> = {
  name: "Previews",
  icon: <ViewAgendaIcon/>,
  component:  PreviewList
}
const MacroDisplayList: DisplayMode<MacroFields> = {
  component: ListList,
  icon: <ViewListIcon/>,
  name: "List"
}


export default function MacroFrame() {
  const [leftOpen, setLeftOpen] = React.useState(true);
  return (
    <Box
      sx={{
        display: "flex",
        flexDireciton: "row",
        height: "100%",
        width: "100%",
      }}
    >
      <Sidebar
        side="left"
        width="304px"
        open={leftOpen}
      >
        <DocList
          store={macroStore}
          displayModes={[
            MacroDisplayList,
            MacroDisplayPreviews
          ]}
          defaultDisplay={MacroDisplayPreviews}
          sortModes={sortModes}
          defaultSort={sortModes[3]}
          sx={{
            width: "300px",
            height: "100%"
          }}
        />
      </Sidebar>
      <Box
        sx={{
          gridArea: "leftmenu",
          display: "flex",
          alignItems: "center",
          flexDirection: "row"
        }}
        >

      <IconButton
        size="small"
        onClick={() => {setLeftOpen(!leftOpen)}}
        sx={{
          alignSelf: "start",
          mt: 1,
          mr: -8,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          backgroundColor: (theme) => theme.vars.palette.background.paper,
          ["&:hover"]: {
            backgroundColor: (theme) => `rgba(${theme.vars.palette.dividerChannel} / 0.48)`
          }
        }}
      >
        <MenuIcon />
      </IconButton>
      </Box>
      <Outlet/>
    </Box>
  )
}