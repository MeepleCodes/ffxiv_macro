import { IconButton, IconButtonProps, Menu, MenuItem } from "@mui/material";
import React from "react";

export type Mode = {
  name: string,
  icon: JSX.Element
}
export interface ModeMenuProps<T extends Mode> extends IconButtonProps {
  modes: T[],
  mode: T,
  setMode: (newValue: T) => void
}
export default function ModeMenu<T extends Mode>({ modes, mode, setMode, ...props }: ModeMenuProps<T>) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = anchorEl !== null;
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return <>
    <IconButton size="small" onClick={handleClick} {...props}>
      {mode.icon}
    </IconButton>
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
    >
      {modes.map(m =>
        <MenuItem
          onClick={() => { handleClose(); setMode(m); }}
          selected={m === mode}
          key={m.name}
        >
          {m.icon} {m.name}
        </MenuItem>
      )}
    </Menu>
  </>
}