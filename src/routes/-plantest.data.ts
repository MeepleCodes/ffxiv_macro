import { AnimatedPlanConfig, CastAnimation, CastPart } from '../components/plans/schemas'
// Start time is 8:43

// First cone at 8:47, then every second
function makeCone(i: number): CastAnimation {
  const id = `aoecone-cast-${i}`;
  return {
    id,
    type: "cast",
    castFrame: 20 + (10 * i),
    castFrames: 10,
    fadeFrames: 10,
    omenFrames: 5,
    part: {
      id,
      type: "aoecone",
      location: {
        x: 100,
        y: 100
      },
      facing: 180 + 45 * i,
      range: 40,
      angle: 60
    }
  }
};
// First sequence cast at 8:47, 51, 55
// Second sequence cast at 8:54, 58, 02
function makeExplosion(start: number, stage: number, x: number, y: number): CastAnimation {
  const id = `rain-${start}-${stage}-${x}-${y}`;
  return {
    id,
    type: "cast",
    omenFrames: 30,
    castFrame: start + (stage + 1) * 40,
    castFrames: 40,
    fadeFrames: 10,
    part: rainMarker(id, stage, x, y)
  }
}
function rainMarker(id: string, stage: number, x: number, y: number): CastPart {
  switch(stage) {
    case 0: return {
      id,
      type: "aoecircle",
      location: {x, y},
      radius: 8
    }
    case 1: return {
      id,
      type: "aoedonut",
      location: {x, y},
      innerRadius: 8,
      outerRadius: 16
    }
    default: return {
      id,
      type: "aoedonut",
      location: {x, y},
      innerRadius: 16,
      outerRadius: 24
    }
  }
}
// Explosions at 8:58 and 9:03
function makePlayerExplosion(frame: number, x: number, y: number): CastAnimation {
  return {
    id: `playerexplosion-${frame}-${x}-${y}`,
    omenFrames: 0,
    castFrame: frame,
    castFrames: 0,
    fadeFrames: 10,
    type: "cast",
    part: {
      id: `player-explosion-${x}-${y}-${frame}`,
      type: "aoecircle",
      location: {x, y},
      radius: 8
    }

  }
}
const playerCoords = [
  {x: 93, y: 100},
  {x: 107, y: 100},
  {x: 100, y: 93},
  {x: 100, y: 107},
  {x: 86, y: 86},
  {x: 86, y: 114},
  {x: 114, y: 86},
  {x: 114, y: 114},
]

export const animationData: AnimatedPlanConfig = {
  zone: "aacm3",
  frames: 220,
  startFrame: ((8 * 60) + 43) * 10,
  // parts: [
  //   makeCone(0)
  // ]
  parts: [
    ...new Array(8).fill(undefined).map((_, i) => makeCone(i)),
    ...new Array(3).fill(undefined).map((_, i) => makeExplosion(0, i, 93, 107)),
    ...new Array(3).fill(undefined).map((_, i) => makeExplosion(0, i, 107, 93)),
    ...new Array(3).fill(undefined).map((_, i) => makeExplosion(70, i, 93, 93)),
    ...new Array(3).fill(undefined).map((_, i) => makeExplosion(70, i, 107, 107)),
    ...playerCoords.map(({x, y}) => makePlayerExplosion(150, x, y)),
    ...playerCoords.map(({x, y}) => makePlayerExplosion(200, x, y)),
  ]
};
