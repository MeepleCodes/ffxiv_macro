import { List, ListItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/analysis/aacm2s/bees/$reportID/')({
  component:BeeIndex
});
const angleStep = (Math.PI * 2) / 16;

function BeeIndex() {
  const {events} = Route.parentRoute.useLoaderData();
  const fightBeeOrder = events.map(fightEvents => 
      fightEvents.firstWave.filter(event => event.type === "cast").map(cast => {
        const x = cast.sourceResources.x - 10000;
        const y = 10000 - cast.sourceResources.y;
        const angle = Math.atan(x/y) + ((y < 0) ? Math.PI : 0);
        const slot = Math.round(angle/angleStep);
        return {x, y, angle, slot}
      })
  );
  return (<>
  {/* <Stack direction="row" sx={{overflow: "hidden"}}>
    {fightBeeOrder.map(fight =>
      <List sx={{overflow: "auto"}}>
        {fight.map(bee => 
        <ListItem>
          slot: {bee.slot} x: {bee.x} y: {bee.y} angle: {bee.angle}
        </ListItem>
        )}
      </List>
      )}
  </Stack> */}
  <TableContainer sx={{overflow: "auto"}}>
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell>Fight</TableCell>
        <TableCell>1st</TableCell>
        <TableCell colSpan={15}>Jumps</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
    {fightBeeOrder.map((fight, idx) => ({fight, idx})).filter(({fight}) => fight.length > 0).map(({fight, idx}) =>
      <TableRow key={idx}>
        <TableCell>{idx+1}</TableCell>
        <TableCell>{fight[0].slot}</TableCell>
        {fight.slice(1).map((bee, i) => 
          <TableCell>{bee.slot - (fight[i].slot)}</TableCell>
        )}
      </TableRow>
      )}
      </TableBody>
    </Table>
    </TableContainer>
  </>)
}