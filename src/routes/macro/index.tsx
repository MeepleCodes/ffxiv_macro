import { createFileRoute } from '@tanstack/react-router'
import MacroScreen from '../../components/macro/MacroScreen';

export const Route = createFileRoute('/macro/')({
  component: MacroIndex
});

function MacroIndex() {
  return <MacroScreen
    
  />
}
