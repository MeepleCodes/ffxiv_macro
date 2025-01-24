import { Box, Button } from "@mui/material";
import { Part } from "./schemas"
import React from "react";
import { ColourPresets } from "./presets";

export type PartPaletteProps = {
  onInsert?: (newPart: Part) => void,
}

const Parts = [
  {
    name: "AoE Circle",
    part: {
      id: "",
      x: 100,
      y: 100,
      name: "AoE Circle",
      type: "aoecircle",
      colour: ColourPresets.Red,
      opacity: 0.8,
      radius: 10
    }
  },
  {
    name: "AoE Cone",
    part: {
      id: "",
      x: 100,
      y: 100,
      name: "AoE Cone",
      type: "aoecone",
      colour: ColourPresets.Red,
      opacity: 0.8,
      range: 10,
      angle: 45,
      facing: 0
    }
  }  
] as const satisfies {name: string, part: Part}[];
function dragStart(event: React.DragEvent, newPart: Part) {
  const payload = JSON.stringify(newPart);
  console.log("Setting drag data to", payload);
  event.dataTransfer.setData("dsib/newpart", payload);
  event.dataTransfer.dropEffect = "copy";
}


export default function PartPalette(props: PartPaletteProps) {
  return (
    <Box>
      {Parts.map((part, i) =>
        <Button
          key={i}
          onDoubleClick={() => {props.onInsert?.(part.part)}}
          draggable
          onDragStart={(event) => {dragStart(event, part.part)}}
        >
          {part.name}
        </Button>
      )}
    </Box>
  )
}