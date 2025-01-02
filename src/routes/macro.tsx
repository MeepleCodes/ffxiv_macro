import { createFileRoute, Outlet } from '@tanstack/react-router'
import MacroTest from './-macrotest'
import MacroTest2 from './-macrotest2'
import MacroScreen from '../components/macro/MacroScreen'

export const Route = createFileRoute('/macro')({
  // component: MacroTest
  // component: MacroRoot
  component: MacroScreen
})

function MacroRoot() {
  return <MacroTest2 macroID={undefined}/>
}