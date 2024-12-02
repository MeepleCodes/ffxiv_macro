import { Button, List, ListItem, ListSubheader, Paper, Stack } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router'
import Delaunator from 'delaunator';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import React from 'react';
import { Circle, Group, Layer, Line, Rect, Stage } from 'react-konva';
import { F } from 'vitest/dist/chunks/config.DCnyCTbs.js';

export const Route = createFileRoute('/nonsense')({
  component: Nonsense
})


type P = {
  id: number;
  x: number;
  y: number;
}
let maxID = 0;

type Point = [number, number];

function nextHalfedge(e: number): number { return (e % 3 === 2) ? e - 2 : e + 1; }
function prevHalfedge(e: number): number { return (e % 3 === 0) ? e + 2 : e - 1; }
function circumcenter(a: Point, b: Point, c: Point): Point {
  const ad = a[0] * a[0] + a[1] * a[1];
  const bd = b[0] * b[0] + b[1] * b[1];
  const cd = c[0] * c[0] + c[1] * c[1];
  const D = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  return [
      1 / D * (ad * (b[1] - c[1]) + bd * (c[1] - a[1]) + cd * (a[1] - b[1])),
      1 / D * (ad * (c[0] - b[0]) + bd * (a[0] - c[0]) + cd * (b[0] - a[0])),
  ];
}
function edgesOfTriangle(t: number): [number, number, number] { return [3 * t, 3 * t + 1, 3 * t + 2]; }

function pointsOfTriangle(delaunay: Delaunator<Float64Array>, t: number): [number, number, number] {
    return edgesOfTriangle(t)
        .map(e => delaunay.triangles[e]) as [number, number, number];
}


export function Nonsense() {
  const [bounds, setBounds] = React.useState([] as P[]);
  const boundsRef = React.useRef<Konva.Line | null>(null);
  const {boundPoints, triEdges, triPoints, cirCentres} = React.useMemo(() => {
    const points = bounds.map(bound => [bound.x, bound.y] as [number, number]);
    const del = Delaunator.from(points);
    const triEdges: [number, number, number, number][] = [];
    for(let e=0; e<del.triangles.length; e++) {
      if(e > del.halfedges[e]) {
        const p = points[del.triangles[e]];
        const q = points[del.triangles[nextHalfedge(e)]];
        triEdges.push([...p, ...q]);
      }
    }
    const triPoints: Point[][] = [];
    const cirCentres: Point[] = [];
    for(let t=0; t<del.triangles.length/3; t++) {
      const vertices = pointsOfTriangle(del, t).map(p => points[p]);
      triPoints.push(vertices);
      cirCentres.push(circumcenter(vertices[0], vertices[1], vertices[2]));
    }
    return {boundPoints: points.flat(1), triEdges, triPoints, cirCentres};
  }, [bounds]);
  const handleClick = (evt: KonvaEventObject<MouseEvent>) => {
    if(evt.currentTarget === evt.target) {
      const pos = evt.target.getRelativePointerPosition();
      if(!pos) return;
      setBounds(bounds => [...bounds, {id: maxID++, x: pos.x, y: pos.y}])
    }
  }
  const handlePointDrag = (evt: KonvaEventObject<MouseEvent>) => {
      if(evt.target.id().startsWith("bound-")) {
        setBounds(bounds => {
          return bounds.map(bound => {
            if(`bound-${bound.id}` !== evt.target.id()) return bound;
            return {...bound, x: evt.target.x(), y: evt.target.y()}
          })
        })
      }
  }
  return (
    <Paper >
    <Stack direction="row" sx={{width: "90vw", height: "90vh"}}>
      <Stage style={{flex: 1}} width={500} height={500}
        onClick={handleClick}
      >
        <Layer>
          <Rect width={500} height={500} fill="white" listening={false}/>
        </Layer>
        <Layer>
          <Line points={boundPoints} ref={boundsRef} closed stroke="red" listening={false}/>
        {bounds.map((bound, i) => 
          <Circle
            id={`bound-${bound.id}`}
            key={bound.id}
            x={bound.x}
            y={bound.y}
            radius={4}
            strokeWidth={2}
            stroke="red"
            fill={i === 0 ? "red" : undefined}
            draggable
            onDragMove={handlePointDrag}
            />
        )}
        </Layer>
        <Layer listening={false}>
          {triEdges.map((tri, i) => 
            <Line
              key={i}  
              points={tri}
              stroke="gray"
              strokeWidth={2}
              opacity={0.1}
              />

          )}
        </Layer>
        <Layer listening={false}>
          {cirCentres.map((c, i) => {
            const vertices = triPoints[i];
            return (
              <Group>
                <Circle
                  key={i}
                  x={c[0]}
                  y={c[1]}
                  stroke="green"
                  opacity={1}
                  strokeWidth={2}
                  radius={4}
                  />
                  {vertices.map((v, i) => 
                  <Line
                    key={i}
                    points={[c[0], c[1], v[0], v[1]]}
                    stroke="green"
                    opacity={0.2}
                    strokeWidth={1}
                    dash={[10, 10]}
                  />
                  )}
              </Group>
              )
            }
          )}
        </Layer>
      </Stage>
      <Stack>
      <List dense>
        <ListSubheader>Bounds</ListSubheader>
        {bounds.map(bound => 
          <ListItem key={`b-${bound.id}`}>x: {bound.x} y: {bound.y}</ListItem>
        )}
        <ListSubheader>cirCentres</ListSubheader>
        {cirCentres.map((c, i) => 
        <ListItem key={`c-${i}`}>x: {c[0]} y: {c[1]}</ListItem>
        )}
      </List>
      <Button
        onClick={() => {setBounds([])}}
        >Reset</Button>
      </Stack>
      
    </Stack>
    </Paper>
  )
}