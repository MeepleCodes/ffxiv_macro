import { createFileRoute } from '@tanstack/react-router'
import { noteStore } from '../../supabase/Notes'
import NotesScreen from '../../components/NotesScreen';

export const Route = createFileRoute('/notes/$noteID')({
  loader: async ({params: {noteID}}) => {console.log("Loading note", noteID); return noteStore.load(noteID).catch(() => null);},
  component: NoteID
    
})

function NoteID() {
  const note = Route.useLoaderData();
  const navigate = Route.useNavigate();
  return <NotesScreen doc={note ?? undefined} onIdChange={(id) => {void navigate({from: Route.parentRoute.fullPath, to: id, replace: true})}}/>
}