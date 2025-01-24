import { createFileRoute } from '@tanstack/react-router'
import { planStore } from '../../supabase/Plans';
import PlanScreen from '../../components/plans/PlanScreen';

export const Route = createFileRoute('/plans/$planID')({
  loader: async ({params: {planID}}) => planStore.load(planID),
  // staleTime: 300_000,
  component: PlanRoot,
});

function PlanRoot() {
  const note = Route.useLoaderData();
  const navigate = Route.useNavigate();
  return <PlanScreen doc={note ?? undefined} onIdChange={(id) => {void navigate({from: Route.parentRoute.fullPath, to: id, replace: true})}}/>


}