import { Button, Input, TextField } from "@mui/material";
import { UISave } from "ffxiv-client-data/uisave/UISave";
import React from "react";
import { Markers, Preset } from "ffxiv-client-data/uisave/FieldMarkers";

function WaymarkPreset(props: {preset: Preset}) {
  const {preset} = props;
  return <>
    Zone: {preset.territoryId}
    <table>
      <thead>
        <tr>
          <th>Mark</th>
          <th>X</th>
          <th>Y</th>
          <th>Z</th>
        </tr>
      </thead>
      <tbody>
        {preset.markers.map(
          (marker, i) => <tr key={i}>
            <th>{Markers[i].name}</th>
            <td>{marker?.x}</td>
            <td>{marker?.y}</td>
            <td>{marker?.z}</td>
          </tr>
        )}
      </tbody>
    </table>
  </>
}

export default function WaymarkTest() {
  const [files, setFiles] = React.useState([] as File[]);
  const [uidata, setUidata] = React.useState(null as UISave | null);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(event.target.files ?? []));
  }
  const handleLoad = () => {
    for(const file of files) {
      file.arrayBuffer().then(value => {
        const view = new DataView(value);
        console.log("Loaded %d bytes", view.byteLength);
        const asHex = new Array(16).fill(null).map((_, i) => {
          const val = view.getUint8(i).toString(16)
          if(val.length < 2) return `0${val}`;
          else return val;
        }).join(" ");
        console.log(asHex);
        setUidata(new UISave(new DataView(value)));
     })
    }
  }
  return (<>
    <TextField
      type="file"
      label="Upload a file"
      onChange={handleChange}
      />
    <Button
      onClick={handleLoad}
      >
        Load
      </Button>
      {uidata && 
        <>
        Loaded {uidata.length} bytes containing {Object.keys(uidata.sections).length} sections and {uidata.getFieldMarkers().presets.length} waymark presets
        <br/>
        
        {uidata.getFieldMarkers().presets.map((p, i) => <WaymarkPreset key={i} preset={p}/>)}
        </>
      }
  </>)
}