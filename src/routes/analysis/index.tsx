import { createFileRoute } from '@tanstack/react-router'
import { AnalysisNav } from '../-AnalysisNav';

export const Route = createFileRoute('/analysis/')({
  component: AnalysisIndex
});

function AnalysisIndex() {
  const reports = Route.parentRoute.useLoaderData();
  return (<>
      <AnalysisNav
        reports={reports}>
      </AnalysisNav>
    </>)
}