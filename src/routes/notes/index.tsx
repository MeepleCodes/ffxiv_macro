import { createFileRoute } from '@tanstack/react-router'
import NotesScreen from '../../components/NotesScreen'

export const Route = createFileRoute('/notes/')({
  component: NoteIndex
})

function NoteIndex() {
  const navigate = Route.useNavigate();
  return <NotesScreen onIdChange={(id) => {void navigate({from: Route.fullPath, to: id, replace: true})}}/>
}