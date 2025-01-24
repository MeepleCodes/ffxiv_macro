import { Avatar, IconButton, List, ListItem, ListItemAvatar, ListItemText } from "@mui/material";
import { DisplayModeComponentProps } from "../DocList";
import DeleteIcon from '@mui/icons-material/Delete';
import { Route as PlanRoute } from '../../routes/plans/$planID';
import { ListItemButtonLink } from "../Links";
import Preview from "../Preview";
import { updated } from "../../supabase/UserDocStore";
import { PlanFields, planStore } from "../../supabase/Plans";



export default function ListList({docs}: DisplayModeComponentProps<PlanFields>) {
  return (
    <List dense>
      {docs.map(plan =>
        <ListItem
          title={plan.name}
          disableGutters
          disablePadding
          key={plan.id}
          secondaryAction={
            <IconButton
              color="inherit"
              aria-label="Delete"
              onClick={(e) => {
                e.stopPropagation();
                void planStore.markDeleted(plan.id);
              }}
            >
              <DeleteIcon/>
            </IconButton>
      }>
          <ListItemButtonLink
            to={PlanRoute.to}
            params={{
              planID: plan.id
            }}
          >
          <ListItemAvatar>
              <Avatar
                variant="square"
                textColor="white"
                component={Preview}
                mask={`data:image/png;base64,${plan.thumbnail_b64}`}
                small
              />
          </ListItemAvatar>
          <ListItemText
            primary={plan.name}
            secondary={updated(plan)}
            primaryTypographyProps={{noWrap: true}}
          />
        </ListItemButtonLink>
      </ListItem>)}
  </List>
  )
}