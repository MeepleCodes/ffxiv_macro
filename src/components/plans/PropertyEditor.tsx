import { List, ListItem } from "@mui/material";
import { Part, PartSchema } from "./schemas";
import { PlanChanger } from "./editable";
import { canvasToGameRotation, gameToCanvasRotation } from "../../analysis/position";
import NumberInput from "./propeditors/NumberInput";
import numberInputClasses from "./propeditors/numberInputClasses";

export type PropertyEditorProps = {
  part: Part,
  byId: PlanChanger["byId"]
}
const angleSettings = {
  step: 1,
  largeStep: 15,
  min: 0,
  max: 360,
  digits: 1
};
const xySettings = {
  step: 0.1,
  largeStep: 1,
  min: 50,
  max: 150,
  digits: 1
};

export default function PropertyEditor(props: PropertyEditorProps) {
  const {part, byId} = props;
  const schema = PartSchema.optionsMap.get(part.type);
  if(schema === undefined) return <>Unknown part type {part.type}</>
  return <>
    Editing {part.name}
    <List
      dense
      sx={{
        color: "pink",
        [`& .${numberInputClasses.root}`]: {
          flex: 1
        },
        [`& .${numberInputClasses.input}`]: {
          width: "3rem"
        }
      }}
      >
      {"x" in part && "y" in part && <>
        <ListItem key="location" sx={{display: "flex", flexDirction: "row", gap: 4}}>
        <NumberInput
            label="X"
            value={part.x}
            onValueChange={(value) => {
              if(value !== null) {
                byId(part.id, part.type, part => {part.x = value});
              }
            }}
            {...xySettings}
          />
          <NumberInput
            label="Y"
            value={part.y}
            onValueChange={(value) => {
              if(value !== null) {
                byId(part.id, part.type, part => {part.y = value});
              }
            }}
            {...xySettings}
          />
        </ListItem>
      </>}
      {"facing" in part && <ListItem key="facing"><NumberInput
        {...angleSettings}
        value={gameToCanvasRotation(part.facing)}
        label="Facing"
        onValueChange={(value) => {
          if(value !== null) {
            byId(
              part.id,
              part.type,
              (part) => {
                part.facing = canvasToGameRotation(value % 360)
              }
            );
          }
        }}
        />
      </ListItem>}
      {"angle" in part && <ListItem key="angle">
        <NumberInput
            label="Angle"
            {...angleSettings}
            value={part.angle}
            onValueChange={(value) => 
              {value !== null && byId(part.id, part.type, (part) => {part.angle = value})}
            }
          />
      </ListItem>}
      {"range" in part && <ListItem key="range">
        <NumberInput
            value={part.range}
            label="Range"
            step={0.1}
            largeStep={1}
            min={0}
            max={50}
            digits={1}
            onValueChange = {(value) => {value !== null && byId(part.id, part.type, (part) => {part.range = value})}}
          />
      </ListItem>}
      {"opacity" in part && <ListItem key="opacity">
        <NumberInput
            
            label="Opacity"
            step={0.01}
            largeStep={0.1}
            min={0}
            max={1}
            digits={2}
            value={part.opacity}
            onValueChange = {(value) => {value !== null && byId(part.id, part.type, (part) => {part.opacity = value})}}
          />
      </ListItem>}
      {Object.entries(schema.shape).map(([propName, propShape], i) =>
      <ListItem key={i}>
        {propName} [{propShape.description}]: {String(part[propName as keyof typeof part])}
      </ListItem>
      )}
    </List>
  </>
}