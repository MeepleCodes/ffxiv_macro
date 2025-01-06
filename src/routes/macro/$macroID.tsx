import { createFileRoute } from '@tanstack/react-router'
import MacroTest from '../-macrotest'
import MacroTest2 from '../-macrotest2';
import { macroStore } from '../../firebase/store/Macro';
import MacroScreen from '../../components/macro/MacroScreen';

export const Route = createFileRoute('/macro/$macroID')({
  loader: async ({params: {macroID}}) => macroStore.load(macroID).catch(() => null),
  component: MacroID
});

function MacroID() {
  const macro = Route.useLoaderData();
  return <MacroScreen
    doc={macro ?? undefined}
  />
}
