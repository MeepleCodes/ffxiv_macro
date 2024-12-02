import { Box, BoxProps, Button, List, ListItemButton, Paper, Popper, SpeedDial, SpeedDialAction, SpeedDialProps, SxProps, Theme } from "@mui/material";
import useWaymarkLoader from "../../waymarks/useWaymarkLoader";
import { Preset } from "ffxiv-client-data/uisave/FieldMarkers";
import HiddenFileInput from "../HiddenFileInput";

import UploadIcon from '@mui/icons-material/Upload';

import territories from "../../waymarks/territories.json";
import React from "react";

export type WaymarkPickerProps = {
  sx?: SxProps<Theme>;
  waymarkPreset: Preset|null;
  setWaymarkPreset: React.Dispatch<React.SetStateAction<Preset|null>>
}

export default function WaymarkPicker(props: WaymarkPickerProps) {
  const {waymarkPreset, setWaymarkPreset, ...rest} = props;
  const [filename, presets, handleChange] = useWaymarkLoader();
  const [anchorEl, setAnchorEl] = React.useState<null|HTMLElement>(null);
  return <Box {...rest}>
    <Button
      onClick={(e) => {setAnchorEl(anchorEl === null ? e.currentTarget : null)}}
      variant="outlined"
      >Waymarks</Button>
  <Popper
    placement="bottom-start"
    disablePortal={false}
    open={anchorEl !== null}
    anchorEl={anchorEl}
    modifiers={[
      {
        name: 'flip',
        enabled: true,
        options: {
          altBoundary: true,
          rootBoundary: 'document',
          padding: 8,
        },
      },
      {
        name: 'preventOverflow',
        enabled: true,
        options: {
          altAxis: true,
          altBoundary: true,
          tether: true,
          rootBoundary: 'document',
          padding: 8,
        },
      },
    ]}
  >
   <Paper sx={{p: 2, display: "flex", flexDirection: "column"}}>
    <Button
      component="label"
      variant="contained"
      role={undefined}
      tabIndex={-1}
      startIcon={<UploadIcon/>}
      >
        <HiddenFileInput onChange={handleChange}/>
        
        Upload UISAVE.DAT
    </Button>
    {presets !== null && 
    <List sx={{maxHeight: 300, overflow: "auto"}}>
      <ListItemButton
        selected={waymarkPreset === null}
        onClick={() => {setWaymarkPreset(null)}}
      >
        <i>None</i>
      </ListItemButton>
      {presets.map((preset, i) => 
      <ListItemButton 
        key={`${filename}-${i}`}
        selected={preset == waymarkPreset}
        onClick={() => {setWaymarkPreset(preset)}}
      >
        {`${territories[preset.territoryId] ?? "Unknown"} (${preset.territoryId})`}: {preset.created.toString()}
      </ListItemButton>
      )}
    </List>
    }
    </Paper> 
  </Popper>
  </Box>
}