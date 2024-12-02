import React from "react"
import { Layer, LayerTypes, Part, Plan, Zones } from "./plans"
import Arena from "../analysis/Arena"
import LayerWrapper from "./LayerWrapper"
import { UpdateContext } from "./UpdateContext"

export type PlanProps = {
  plan: Plan
  setPlan: React.Dispatch<React.SetStateAction<Plan>>
}

function spliceIn<T extends Part>(existing: T[], newSelf: T): T[] {
  const idx = existing.findIndex(e => e.id === newSelf.id);
  return idx === -1 ? 
    [...existing, newSelf] :
    existing.toSpliced(
      idx,
      1,
      newSelf
    );
}
export default function PlanView(props: PlanProps) {
  const {plan, setPlan} = props;
  const {layers, zone: zoneOrName} = plan;
  const zone = typeof(zoneOrName) === "string" ? Zones[zoneOrName] : zoneOrName;
  
  // Later this is going to have to get more complicated to handle nested parts (e.g. layers, groups)
  const updateLayer = React.useCallback((layer: Layer) => {
    console.log("Updating layer", layer.id);
    setPlan(plan => {
      const idx = plan.layers.findIndex(l => l.id === layer.id);
      const layers = idx === -1 ? 
        [...plan.layers, layer] :
        plan.layers.toSpliced(
          idx,
          1,
          layer
        );
      return {
        zone: plan.zone,
        layers
      }      
    })
  }, [setPlan]);
  const layerUpdaters = React.useMemo(() => {
    return layers.map(layer => (newSelf: Part) => {
      console.log("Updating part", newSelf.id, "in layer", layer.id);
      const {children, ...rest} = layer;
      updateLayer({
        ...rest,
        children: spliceIn(children, newSelf)
      })
    });
  }, [layers, updateLayer]);
  return (
    <Arena
      backgroundImageUrl={zone.image}
      backgroundImageScale={zone.scale ?? 1}
    >
      {layers.map((layer, i) => 
        <UpdateContext.Provider value={layerUpdaters[i]} key={layer.id}>
          {LayerTypes[layer.type].fn({...layer})}
        </UpdateContext.Provider>
      )}
    </Arena>
  )
}