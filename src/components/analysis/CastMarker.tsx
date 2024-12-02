import { Arc, Circle, Group, KonvaNodeEvents, Line, Rect, Ring } from "react-konva";
import { gameToCanvasDist, logToCanvasCoord, logToCanvasRotation } from "./position";
import { Shape, ShapeConfig } from "konva/lib/Shape";
import { ReplayEvent } from "./events";
import { DonutRadii, guessConeAngle, guessDonutRadius } from "./markers";
import { ActionCast } from "../../excel/Action";
import React from "react";

/*
            2 => new AOEShapeCircle(data.EffectRange), // used for some point-blank aoes and enemy location-targeted - does not add caster hitbox
            3 => new AOEShapeCone(data.EffectRange + actor.HitboxRadius, DetermineConeAngle(data) * 0.5f),
            4 => new AOEShapeRect(data.EffectRange + actor.HitboxRadius, data.XAxisModifier * 0.5f),
            5 => new AOEShapeCircle(data.EffectRange + actor.HitboxRadius),
            //6 => ???
            //7 => new AOEShapeCircle(data.EffectRange), - used for player ground-targeted circles a-la asylum
            //8 => charge rect
            10 => new AOEShapeDonut(DetermineDonutInner(data), data.EffectRange),
            11 => new AOEShapeCross(data.EffectRange, data.XAxisModifier * 0.5f),
            12 => new AOEShapeRect(data.EffectRange, data.XAxisModifier * 0.5f),
            13 => new AOEShapeCone(data.EffectRange, DetermineConeAngle(data) * 0.5f),
            */

export type CastMarkerProps = {
  cast: ReplayEvent,
} & ShapeConfig & KonvaNodeEvents;

export default function CastMarker({cast, ...shapeProps}: CastMarkerProps) {
  const {
    stroke = "red",
    strokeWidth = 2,
    fill = "red", 
    opacity = 0.5
  } = shapeProps;
  const shapeStyle: ShapeConfig = {
    stroke,
    strokeWidth,
    fill,
    opacity
  };



  
  const sourceLoc = {x: logToCanvasCoord(cast.source.x), y: logToCanvasCoord(cast.source.y), facing: logToCanvasRotation(cast.source.facing)};
  const targetLoc = cast.target === undefined ? {...sourceLoc} : {x: logToCanvasCoord(cast.target.x), y: logToCanvasCoord(cast.target.y), facing: logToCanvasRotation(cast.target.facing)};
  switch(cast.action.CastType) {
    case 2: {
      const l = cast.action.CanTargetHostile ? targetLoc : sourceLoc;
      return <Group
        x={l.x}
        y={l.y}
        {...shapeProps}
        >
          <Circle
            radius={gameToCanvasDist(cast.action.EffectRange)}
            {...shapeStyle}
          />
          <Circle
            radius={5}
            fill="black"
          />
        </Group> 
    }
    case 8: { // Charge, line AE forward only?
      const range = gameToCanvasDist(cast.action.EffectRange);
      const width = gameToCanvasDist(cast.action.XAxisModifier);
      return <Rect
        rotation={sourceLoc.facing}
        x={sourceLoc.x}
        y={sourceLoc.y}
        offsetX={width/2}
        offsetY={0}
        width={width}
        height={range}
        {...shapeStyle}
        {...shapeProps}
      />

    }
    case 10: { // Donut, inner radius has to be guessed/hardcoded
      const innerRadius = guessDonutRadius(cast.action["#"]);
      return <Ring
      x={sourceLoc.x}
      y={sourceLoc.y}
        innerRadius={gameToCanvasDist(innerRadius)}
        outerRadius={gameToCanvasDist(cast.action.EffectRange)}
        {...shapeStyle}
        {...shapeProps}
        />
    }
    case 11: { // Cross pattern
      const range = gameToCanvasDist(cast.action.EffectRange);
      const width = gameToCanvasDist(cast.action.XAxisModifier);
      return <Group
        rotation={sourceLoc.facing}
        x={sourceLoc.x}
        y={sourceLoc.y}
        {...shapeProps}
        >
          <Rect x={-width/2} y={-range} width={width} height={range * 2} {...shapeStyle}/>
          <Rect x={-range} y={-width/2} width={range * 2} height={width} {...shapeStyle}/>
      </Group>
    }
    case 12: { // Line AE (forward and backward?)
      const range = gameToCanvasDist(cast.action.EffectRange);
      const width = gameToCanvasDist(cast.action.XAxisModifier);
      console.log("Rendering cast type 12 at offset %d,%d", sourceLoc.x, sourceLoc.y);
      return <Rect
        rotation={sourceLoc.facing}
        x={sourceLoc.x}
        y={sourceLoc.y}
        offsetX={width/2}
        offsetY={range}
        width={width}
        height={range*2}
        {...shapeStyle}
        {...shapeProps}
      />

    }
    case 13: { // Cone pattern
      const angle = guessConeAngle(cast.action["#"]);
      return <Arc
        x={sourceLoc.x}
        y={sourceLoc.y}
        innerRadius={0}
        outerRadius={gameToCanvasDist(cast.action.EffectRange)}
        // angle={angle}
        angle={angle}
        // Konva arcs start from directly east and extend clockwise
        rotation={sourceLoc.facing - angle/2 + 90}
        // rotation={315-45}
        {...shapeStyle}
        {...shapeProps}
        />

    }
    default:
      return <Line
        x={sourceLoc.x}
        y={sourceLoc.y}
        points={[0, 0, 0, gameToCanvasDist(cast.action.EffectRange)]}
        rotation={sourceLoc.facing}
        {...shapeStyle}
        {...shapeProps}
      />
  }
}