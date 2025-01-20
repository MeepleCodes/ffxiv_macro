import { Avatar, IconButton, List, ListItem, ListItemAvatar, ListItemText } from "@mui/material";
import { DisplayModeComponentProps } from "../DocList";
import { MacroFields, macroStore } from "../../supabase/Macro";
import DeleteIcon from '@mui/icons-material/Delete';
import { Route as MacroRoute } from '../../routes/macro/$macroID';
import { ListItemButtonLink } from "../Links";
import Preview from "./Preview";
import { updated } from "../../supabase/UserDocStore";



export default function ListList({docs}: DisplayModeComponentProps<MacroFields>) {
  return (
    <List dense>
      {docs.map(macro =>
        <ListItem
          title={macro.name}
          disableGutters
          disablePadding
          key={macro.id}
          secondaryAction={
            <IconButton
              color="inherit"
              aria-label="Delete"
              onClick={(e) => {
                e.stopPropagation();
                void macroStore.markDeleted(macro.id);
              }}
            >
              <DeleteIcon/>
            </IconButton>
      }>
          <ListItemButtonLink
            to={MacroRoute.to}
            params={{
              macroID: macro.id
            }}
          >
          <ListItemAvatar>
              <Avatar
                variant="square"
                textColor="white"
                component={Preview}
                mask={`data:image/png;base64,${macro.thumbnail_b64}`}
                small
              />
          </ListItemAvatar>
          <ListItemText
            primary={macro.name}
            secondary={updated(macro)}
            primaryTypographyProps={{noWrap: true}}
          />
        </ListItemButtonLink>
      </ListItem>)}
  </List>
  )
}