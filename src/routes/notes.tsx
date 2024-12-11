import { createFileRoute, createLink, Outlet } from '@tanstack/react-router'
import UserMenu from '../components/UserMenu'
import { NavDrawer, NavMain } from '../Nav'
import React from 'react';
import { Box, Button, Drawer, IconButton, List, ListItem, ListItemText, Paper, Tooltip } from '@mui/material';
import { updated, useWatchOwnDocs } from '../firebase/store/UserDocStore';
import { NoteDoc, noteStore } from '../firebase/store/Notes';
import { ListItemButtonLink } from '../components/Links';
import DeleteIcon from '@mui/icons-material/Delete';
import { useConfirm } from 'material-ui-confirm';
import MenuIcon from '@mui/icons-material/Menu';

export const Route = createFileRoute('/notes')({
  component: Notes
})

function Notes() {
  const savedNotes = useWatchOwnDocs(noteStore);
  const confirm = useConfirm();
  const [open, setOpen] = React.useState(true);
  const deleteHandler = React.useCallback((note: NoteDoc) => {
    return () => {
      confirm({
        description: `Delete note '${note.name}'?`
      }).then(() => {
        return noteStore.markDeleted(note.id);
      }).catch(() => {})
    }
  }, [confirm]);
  return <>
    <Box
      sx={{
        display: "grid",
        height: "100%",
        gridTemplateRows: "minmax(56px, min-content) 1fr",
        gridTemplateColumns: `min-content 56px 1fr`,
        gridTemplateAreas: `"drawer menu toolbar"
                            "drawer main main   "`        
      }}
    >
    <Paper
      square
      sx={{
        gridArea: "drawer",
        borderLeft: 2,
        borderRight: 1,
        borderColor: (theme) => theme.vars.palette.divider,
        width: open ? "300px" : 0,
        transition: "width 300ms",
        overflow: "hidden"
      }}
      elevation={1}
      >
      {/* <Drawer
        open={open}
        variant="persistent"
        sx={{
          gridArea: "drawer",
          position: "relative",
          width: open ? "300px" : 0
        }}
        PaperProps={{
          elevation: 1,
          sx: {
            position: "relative",
            
          }
        }}
        > */}
      <List sx={{width: "300px"}}>
        
        {savedNotes.map(note => 
          <ListItem key={note.id} disablePadding secondaryAction={
            <Tooltip title="Delete this note">
              <IconButton onClick={deleteHandler(note)}>
                <DeleteIcon/>
              </IconButton>
            </Tooltip>
          }>
            <ListItemButtonLink to={note.id} from={Route.fullPath}>
              <ListItemText primary={note.name} secondary={updated(note)}/>
            </ListItemButtonLink>
          </ListItem>
        )}
        
      </List>
    {/* </Drawer> */}
    </Paper>
    <IconButton
      sx={{
        gridArea: "menu"
      }}
      onClick={() => {setOpen(!open)}}
    >
      <MenuIcon/>
    </IconButton>
    {/* <Box sx={{
      p: 1,
      pt: 7,
      gridArea: "main",
      overflow: "hidden",
      alignSelf: "stretch"
    }}> */}
      <Outlet/>
    {/* </Box> */}
    {/* <UserMenu
      sx={{
        gridArea: "toolbar",
        position: "absolute",
        top: 0,
        right: 0,
        m: 1
      }}
    /> */}
    </Box>
  </>
}