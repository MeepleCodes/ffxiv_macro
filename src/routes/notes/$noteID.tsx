import { createFileRoute } from '@tanstack/react-router'
import { noteStore } from '../../firebase/store/Notes'
import NotesScreen from '../../components/NotesScreen';

export const Route = createFileRoute('/notes/$noteID')({
  loader: async ({params: {noteID}}) => noteStore.load(noteID),
  component: NoteID
    
})

function NoteID() {
  const note = Route.useLoaderData();
  const navigate = Route.useNavigate();
  return <NotesScreen doc={note ?? undefined} onIdChange={(id) => {void navigate({from: Route.parentRoute.fullPath, to: id, replace: true})}}/>
}