import { Group } from "react-konva";
import AoEDonut from "../drawing/AoEDonut";
import Draggable from "./Draggable";
import { Part, PartSchema } from "./schemas"
import AoECircle from "../drawing/AoECircle";
import AoECone from "../drawing/AoECone";

export type PlanPartProps = {
  config: Part,
  onChange?: (newConfig: Part) => void,
  onChildChange?: (newConfig: Part) => void,
}
export default function PlanPart(props: PlanPartProps) {
  const {config, onChange, onChildChange} = props;
  switch(config.type) {
    case "aoedonut": {
      return <Draggable type={config.type} component={AoEDonut} config={config} onChange={onChange}/>
    }
    case "aoecircle": {
      return <Draggable type={config.type} component={AoECircle} config={config} onChange={onChange}/>
    }
    case "aoecone": {
      return <Draggable type={config.type} component={AoECone} config={config} onChange={onChange}/>
    }    
    case "group": {
      const children = PartSchema.array().parse(config.elements);
      return <Group>
        {children.map(element => 
          <PlanPart key={element.id} config={element} onChange={onChildChange} onChildChange={onChildChange} />
        )}
      </Group>
    }
    
  }
}