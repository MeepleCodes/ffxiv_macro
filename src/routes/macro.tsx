import { createFileRoute } from '@tanstack/react-router'


import MacroFrame from '../components/macro/MacroFrame';



export const Route = createFileRoute('/macro')({
  // component: MacroTest
  // component: MacroRoot
  component: MacroFrame
})
