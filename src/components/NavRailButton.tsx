import { IconButton, styled } from "@mui/material";
import { createLink } from "@tanstack/react-router";

const NavRailButton = createLink(
  styled(
    IconButton
  )(({theme}) => ({
    flexDirection: "column",
    width: "56px",
    height: "72px",
    gap: 4,
    fontSize: 0,
    transition: "width 300ms, height 300ms, font-size 300ms",
    color: `rgba(${theme.vars.palette.text.primaryChannel} / 0.72)`,
    ["&.active"]: {
      color: theme.vars.palette.primary.main
    }
  }))
);

export default NavRailButton;