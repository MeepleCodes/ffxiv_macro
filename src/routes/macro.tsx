import { createFileRoute, Outlet } from '@tanstack/react-router'
import MacroTest from './-macrotest'
import MacroTest2 from './-macrotest2'

export const Route = createFileRoute('/macro')({
  // component: MacroTest
  component: MacroRoot
})

function MacroRoot() {
  return <MacroTest2 macroID={undefined}/>
}