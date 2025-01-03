import { createFileRoute, Outlet } from '@tanstack/react-router'
import MacroTest from './-macrotest'
import MacroTest2 from './-macrotest2'
import MacroScreen from '../components/macro/MacroScreen'
import MenuIcon from '@mui/icons-material/Menu';
import React from 'react'
import { Box, IconButton } from '@mui/material'
import { Sidebar } from '../components/Sidebar'
import DocList, { SortMode } from '../components/DocList'
import { MacroFields, macroStore } from '../firebase/store/Macro'
import { MacroDisplayList } from '../components/macro/MacroListList'
import { MacroDisplayPreviews } from '../components/macro/MacroListPreview'

import SortAlphabeticalAscending from 'mdi-material-ui/SortAlphabeticalAscending';
import SortAlphabeticalDescending from 'mdi-material-ui/SortAlphabeticalDescending';
import SortClockAscendingOutline from 'mdi-material-ui/SortClockAscendingOutline';
import SortClockDescendingOutline from 'mdi-material-ui/SortClockDescendingOutline';
import SortVariantOff from 'mdi-material-ui/SortVariantOff';



export const Route = createFileRoute('/macro')({
  // component: MacroTest
  // component: MacroRoot
  component: MacroRoot
})

const sortModes: SortMode<MacroFields>[] = [
  {name: "Unsorted", icon: <SortVariantOff/>, sortOrder: undefined},
  {name: "Name", icon: <SortAlphabeticalAscending/>, sortOrder: {key: "name", direction: "asc"}},
  {name: "Name (reversed)", icon: <SortAlphabeticalDescending/>, sortOrder: {key: "name", direction: "desc"}},
  {name: "Newest first", icon: <SortClockAscendingOutline/>, sortOrder: {key: "updated", direction: "desc"}},
  {name: "Oldest first", icon: <SortClockDescendingOutline/>, sortOrder: {key: "updated", direction: "asc"}},
];


function MacroRoot() {
  const [leftOpen, setLeftOpen] = React.useState(true);
  return (
    <Box
      sx={{
        display: "grid",
        height: "100%",
        gridTemplateRows: "56px 1fr",
        gridTemplateColumns: `min-content 56px minmax(min-content, 1fr) min-content 56px`,
        gridTemplateAreas: `"leftdrawer leftmenu   toolbar     toolbar     rightmenu"
                            "leftdrawer main       main        rightdrawer rightdrawer"`        
      }}
    >
      <Sidebar
        side="left"
        width="300px"
        open={leftOpen}
        sx={{
          gridArea: "leftdrawer"
        }}
      >
        <DocList
          store={macroStore}
          displayModes={[
            MacroDisplayList,
            MacroDisplayPreviews
          ]}
          sortModes={sortModes}
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