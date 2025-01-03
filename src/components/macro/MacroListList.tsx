import { Avatar, IconButton, List, ListItem, ListItemAvatar, ListItemText } from "@mui/material";
import { DisplayMode, DisplayModeComponentProps } from "../DocList";
import { MacroFields, macroStore } from "../../firebase/store/Macro";
import DeleteIcon from '@mui/icons-material/Delete';
import { Route as MacroRoute } from '../../routes/macro/$macroID';
import { ListItemButtonLink } from "../Links";
import Preview from "./Preview";
import { updated } from "../../firebase/store/UserDocStore";

import ViewListIcon from '@mui/icons-material/ViewList';

export const MacroDisplayList: DisplayMode<MacroFields> = {
  component: ListList,
  icon: <ViewListIcon/>,
  name: "List"
}
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
                macroStore.markDeleted(macro.id);
              }}
            >
              <DeleteIcon/>
            </IconButton>
      }>
          <ListItemButtonLink
            to={MacroRoute.fullPath}
            params={{
              macroID: macro.id
            }}
          >
          <ListItemAvatar>
              <Avatar
                variant="square"
                textColor="white"
                component={Preview}
                mask={`data:image/png;base64,${macro.thumbnail.toBase64()}`}
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