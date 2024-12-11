import { Link } from "@mui/material";
import { ListItemButton } from "@mui/material";
import { Tab } from "@mui/material";
import { createLink } from "@tanstack/react-router";


export const TabLink = createLink(Tab);
export const RouteLink = createLink(Link);
export const ListItemButtonLink = createLink(ListItemButton);