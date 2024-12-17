import { createFileRoute } from '@tanstack/react-router'
import MacroTest from '../-macrotest'
import MacroTest2 from '../-macrotest2';

export const Route = createFileRoute('/macro/$macroID')({
  // component: MacroTest
  component: MacroID
});

function MacroID() {
  const {macroID} = Route.useParams();
  return <MacroTest2 macroID={macroID}/>
}