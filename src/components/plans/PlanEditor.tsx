import { Group, Layer, Transformer } from "react-konva"
import Arena from "../drawing/Arena"
import { PlanChanger } from "./editable"
import { Part, PartSchema, Plan } from "./schemas"
import PartEditor from "./PartEditor"
import { Box, Button, Paper, Typography } from "@mui/material"
import React from "react"
import Konva from "konva"
import { canvasToGame } from "../../analysis/position"
import { Position } from "../drawing/types"
import { KonvaEventObject, Node } from "konva/lib/Node"
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer"
import { Transform } from "konva/lib/Util"

export type PlanEditorProps = {
  plan: Plan,
  changers: PlanChanger,
  page: number,
  arena: number,
  // TODO: I think these need to be an array or we're going to be re-rendering excessively
  selection: Set<string>,
  setSelection: React.Dispatch<React.SetStateAction<Set<string>>>
}

const PlanEditor = function PlanEditor(props: PlanEditorProps) {
  const {plan, changers, page, arena, selection, setSelection} = props;
  const [pxPos, setPxPos] = React.useState<Position|null>(null);
  const stageRef = React.useRef<Konva.Stage>(null);
  const tRef = React.useRef<KonvaTransformer>(null);
  React.useEffect(() => {
    tRef.current?.nodes(selection.values().map(id => stageRef.current?.findOne(`#${id}`)).filter(n => n !== undefined).toArray())
  }, [selection]);

  
  const handleDragOver = (ev: React.DragEvent) => {
    stageRef.current?.setPointersPositions(ev);
    setPxPos(stageRef.current?.getRelativePointerPosition() ?? null);
    if(ev.dataTransfer.types.includes("dsib/newpart")) {
      // TODO: It would be nice to inspect the data to show an outline, but
      // we aren't allowed to inspect the dataTransfer data until it's dropped
      // so this needs sidechannelling somehow - either a global context state
      // or nonsense involving setting extra data types
      ev.preventDefault();
    }
  }
  const handleDragLeave = () => {
    
  }
  const handleDrop = (ev: React.DragEvent) => {
    
    if(ev.dataTransfer.types.includes("dsib/newpart")) {
      ev.preventDefault();
      try {
        stageRef.current?.setPointersPositions(ev);

        const transfer = ev.dataTransfer.getData("dsib/newpart");
        const template = PartSchema.parse(JSON.parse(transfer));
        const pixelPos = stageRef.current?.getRelativePointerPosition() ?? null;
        const gamePos = pixelPos !== null ?
          {x: canvasToGame(pixelPos.x), y: canvasToGame(pixelPos.y)} :
          {x: 100, y: 100};
        const part = {
          ...template,
          id: crypto.randomUUID(),
          ...gamePos
        };
        changers.pages[page].arenas[arena].layers[0].onAdd(part);
      } catch(e: unknown) {
        console.error("Invalid drop data", e);
      }

    }
  }
  const handleMouseMove = () => {
    setPxPos(stageRef.current?.getRelativePointerPosition() ?? null);
  }

  return (
  <Box
    onDragOver={handleDragOver}
    onDrop={handleDrop}
    onDragLeave={handleDragLeave}
    onMouseMove={handleMouseMove}
    sx={{flex: 1, display: "flex", position: "relative"}}
 >
    <Arena zone={plan.zone} ref={stageRef} onClick={(evt: KonvaEventObject<MouseEvent>) => {
      if(evt.target === stageRef.current) {
        setSelection(new Set());
      }
    }}>
      <Layer>
        {plan.pages[page].arenas[arena].layers.map(
          (layer, layer_idx) =>
            <Group key={layer_idx}>
              {layer.children.map(
                (part, part_idx) => {
                  // const ident = `${page}-${arena}-${layer_idx}-${part_idx}`;
                  // const isSelected = selected.has(ident);
                  return <PartEditor
                    part={part}
                    key={part.id}
                    onMouseDown={(ev) => {
                      console.log("Selecting", ev.currentTarget, "with bounds", ev.currentTarget.getClientRect())
                      const myId = new Set([part.id]);
                      if(ev.evt.shiftKey) {
                        setSelection(selection.symmetricDifference(myId));
                      } else if(!selection.has(part.id)) {
                        setSelection(myId);
                      }
                    }}
                    changer={changers.pages[page].arenas[arena].layers[layer_idx].parts[part_idx]}
                  />
                }
              )}
              <Transformer ref={tRef} resizeEnabled={false} draggable shouldOverdrawWholeArea/>
              {/* <Transformer
                resizeEnabled={false}
                ref={tRef}
              >
              {layer.parts.map(
                (part, part_idx) => {
                  const isSelected = selected.includes(part);
                  return isSelected && <PartEditor
                    part={part}
                    key={part.id}
                    onClick={(ev) => {
                      if(ev.evt.shiftKey) {
                        setSelected(parts => parts.length === 1 ? parts : parts.filter(p => p !== part));
                      } else {
                        setSelected([part]);
                      }
                    }}                    
                    changer={changers.pages[page].arenas[arena].layers[layer_idx].parts[part_idx]}
                  />
                }
              )}                
              </Transformer> */}
              
            </Group>
        )}
      </Layer>

    </Arena>
    <Paper
      sx={{
        position: "absolute",
        left: 0,
        bottom: 0,
        ml: 1,
        mb: 1,
        display: "flex",
        flexDirection: "row",
        gap: "4px",
        px: 1,
        py: 0.5,
        font: (theme) => theme.vars.font.caption,
        "& .Coord": {
          display: "inline-block",
          width: "55px"
        },
      }}
    >
      {pxPos !== null && <>
      <Box className="Coord">
        x: {canvasToGame(pxPos.x).toFixed(2)}
      </Box>
      <Box className="Coord">
        z: {canvasToGame(pxPos.y).toFixed(2)}
      </Box>
      </>}
        {selection.size > 0 ? <>{selection.size} item(s) selected : {selection.values().toArray().toString()}</> : <> No selection</>} 
    </Paper>
  </Box>
  )
};
export default PlanEditor;