import { KonvaNodeEvents } from "react-konva";
import { guessConeAngle, guessDonutRadius } from "./markers";
import { RenderableEvent } from "./events";
import { AoEProps } from "../drawing/types";
import { CastType, ThroughRectangles } from "../../excel/casts";
import AoECircle from "../drawing/AoECircle";
import AoERect from "../drawing/AoERect";
import AoECross from "../drawing/AoECross";
import AoEDonut from "../drawing/AoEDonut";
import AoECone from "../drawing/AoECone";

export type CastMarkerProps = {
  cast: RenderableEvent,
} & AoEProps & KonvaNodeEvents;

export default function CastMarker({cast, ...shapeProps}: CastMarkerProps) {
  switch(cast.ability.castType) {
    case CastType.TargetableCircle:
      if(cast.ability.canTargetHostile && cast.target !== undefined && cast.target.location !== null) {
        return <AoECircle
          x={cast.target.location.x}
          y={cast.target.location.y}
          range={cast.ability.effectRange}
          {...shapeProps}
          />
      } else {
        return <AoECircle
          x={cast.source.location.x}
          y={cast.source.location.y}
          range={cast.ability.effectRange}
          {...shapeProps}
          />        
      }
    case CastType.ChargeRectangle:
      return <AoERect
        x={cast.source.location.x}
        y={cast.source.location.y}
        facing={cast.source.location.facing}
        width={cast.ability.xAxisModifier}
        range={cast.ability.effectRange}
        {...shapeProps}
      />      
    case CastType.Rectangle:
      return <AoERect
        x={cast.source.location.x}
        y={cast.source.location.y}
        variant={ThroughRectangles.includes(cast.ability.id) ?  "through" : "forward"}
        facing={cast.source.location.facing}
        width={cast.ability.xAxisModifier}
        range={cast.ability.effectRange}
        {...shapeProps}
      />
    case CastType.Cross:
      return <AoECross
        x={cast.source.location.x}
        y={cast.source.location.y}
        facing={cast.source.location.facing}
        width={cast.ability.xAxisModifier}
        range={cast.ability.effectRange}
        {...shapeProps}
      />
    case CastType.Donut: {
      const innerRadius = guessDonutRadius(cast.ability.id);
      return <AoEDonut
        x={cast.source.location.x}
        y={cast.source.location.y}
        innerRadius={innerRadius}
        outerRadius={cast.ability.effectRange}
        {...shapeProps}
      />
    }
    case CastType.Cone: {
      const coneAngle = guessConeAngle(cast.ability.id);
      return <AoECone
        x={cast.source.location.x}
        y={cast.source.location.y}
        facing={cast.source.location.facing}
        range={cast.ability.effectRange}
        angle={coneAngle}
        {...shapeProps}
      />
    }

  }
}