import { createFileRoute } from '@tanstack/react-router'
import useImage from 'use-image';
import { Plan } from '../components/oldplans/plans';
import PlanView from '../components/oldplans/PlanView';
import React from 'react';
import { Paper } from '@mui/material';

export const Route = createFileRoute('/fusedown')({
  component: Fusedown
})

const bombsOne = [
  {x: 90.60, y: 90.60},
  {x: 109.40, y: 109.40},
  {x: 107.95, y: 100.00},
  {x: 100.00, y: 92.05}
];
const bombsTwo = [
  {x: 92.05,  y: 100.00},
  {x: 90.60,  y: 109.40},
  {x: 100.00, y: 107.95},
  {x: 109.40, y: 90.60 },
]

const defaultPlan: Plan = {
  zone: "aacm3",
  layers: [
    {
      id: "1",
      type: "safespot",
      walkable: { type: "rect", width: 30, height: 30},
      children: bombsOne.map((loc, i) => ({type: "cast", id: `bombone-${i}`, radius: 8, ...loc})),
      fill: "cyan",
      opacity: 0.2
    },
   {
      id: "2",
      type: "safespot",
      walkable: { type: "rect", width: 30, height: 30},
      children: bombsTwo.map((loc, i) => ({type: "cast", id: `bombone-${i}`, radius: 8, ...loc})),
      fill: "yellow",
      opacity: 0.2
    },    
    {
      id: "L1",
      type: "layer",
      children: [
        ...([["MT", "TankRole"], ["OT", "TankRole"], ["H1", "HealerRole"], ["H2", "HealerRole"]].map(([label, icon], i) => ({
          id: `support-${i}`,
          type: "player",
          icon: icon,
          label: label,
          aeMarker: {
            radius: 6
          },
          extraIcon: {
            image: "misc/fuse-short.png",
            shadowOpacity: 1,
            shadowBlur: 3,
            shadowColor: "black",
            x: -2,
            y: -52
          }
        })))
      ]
    },

 
    
  ]
};

function Fusedown() {

  // const [plan, setPlan] = React.useState<Plan>(() => {
  //   const saved = localStorage.getItem("plan");
  //   const decoded = saved != null ? JSON.parse(saved) as Plan : null;
  //   return decoded || defaultPlan;
  // });
  // React.useEffect(() => {
  //   localStorage.setItem("plan", JSON.stringify(plan))
  // }, [plan]);
  const [plan, setPlan] = React.useState<Plan>(defaultPlan);
  return <>
  <PlanView plan={plan} setPlan={setPlan}/>
    <Paper sx={{position: "absolute", right: 0, width: 400, top: 0, bottom: 0, overflow: "auto"}}>
      <pre>
        {JSON.stringify(plan, null, 2)}
      </pre>
    </Paper>
  
  </>
  // return <Arena
  //   backgroundImageUrl={aacm3s}
  //   backgroundImageScale={0.75}
  //   >
      
  //   <Layer>
  //     <Rect
  //      x={gameToCanvas(85)}
  //      y={gameToCanvas(85)}
  //      width={gameToCanvasDist(30)}
  //      height={gameToCanvasDist(30)}
  //      fill="cyan"
  //      opacity={0.2}
  //      />
  //      {bombsOne.map(({x, y}, i) => 
  //       <Circle
  //         key={i}
  //         fill="white"
  //         x={gameToCanvas(x)}
  //         y={gameToCanvas(y)}
  //         radius={gameToCanvasDist(8)}
  //         globalCompositeOperation="destination-out"
  //       />
  //      )}
  //   </Layer>
  //   <Layer>
  //     <Rect
  //      x={gameToCanvas(85)}
  //      y={gameToCanvas(85)}
  //      width={gameToCanvasDist(30)}
  //      height={gameToCanvasDist(30)}
  //      fill="yellow"
  //      opacity={0.2}
  //      />
  //      {bombsTwo.map(({x, y}, i) => 
  //       <Circle
  //         key={i}
  //         fill="white"
  //         x={gameToCanvas(x)}
  //         y={gameToCanvas(y)}
  //         radius={gameToCanvasDist(8)}
  //         globalCompositeOperation="destination-out"
  //       />
  //      )}
  //   </Layer>
  //   <Layer>
  //     <PlayerMarker icon='TankRole' label="MT" location={{x: gameToCanvas(100), y: gameToCanvas(100)}} draggable iconOpacity={0.5}>
  //       <Image
  //         image={fuseShort}
  //         shadowOpacity={1}
  //         shadowBlur={3}
  //         shadowColor='black'
  //         x={-2}
  //         y={-(fuseShort?.height ?? 0) - 18}
  //       />
  //       <Circle
  //         stroke="red"
  //         strokeWidth={2}
  //         opacity={0.8}
  //         dash={[10, 10]}
  //         radius={gameToCanvasDist(6)}
  //       />
  //     </PlayerMarker>
  //   </Layer>
  // </Arena>
}