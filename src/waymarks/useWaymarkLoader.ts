import { Preset } from "ffxiv-client-data/uisave/FieldMarkers";
import { UISave } from "ffxiv-client-data/uisave/UISave";
import React from "react";

export default function useWaymarkLoader(): [string|null, Preset[]|null, React.FormEventHandler<HTMLInputElement>] {
  // Internal state, we'll derive the waymark data from this via a memo
  const [uiData, setUIData] = React.useState(null as UISave|null);

  // Exposed state
  const [filename, setFilename] = React.useState(null as string|null);
  const waymarks = React.useMemo(() => 
    uiData?.getFieldMarkers().presets.filter(preset => preset.used) ?? null
  , [uiData]);
  
  // Exposed functions
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if(event.target.files === null || event.target.files.length === 0) return;
    const file = event.target.files[0];
    setFilename(file.name);
    file.arrayBuffer().then(value => {
      setUIData(new UISave(new DataView(value)));
    }).catch((e: unknown) => {
      setUIData(null);
      console.error("Failed to load/parse UISAVE.DAT", e);
    });
  }

  return [filename, waymarks, handleUpload];
}