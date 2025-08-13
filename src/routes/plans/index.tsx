import { createFileRoute } from '@tanstack/react-router'
import PlanScreen from '../../components/plans/PlanScreen';

export const Route = createFileRoute('/plans/')({
  // staleTime: 300_000,
  component: PlanRoot,
});

function PlanRoot() {
  const navigate = Route.useNavigate();
  return <PlanScreen onIdChange={(id) => {void navigate({from: Route.parentRoute.fullPath, to: id, replace: true})}}/>


}