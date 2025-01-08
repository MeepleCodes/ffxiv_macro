import { createFileRoute, Outlet } from '@tanstack/react-router'
import { fetchMeta } from '../../analysis/fetch';
import ReportNav from './-ReportNav';

export const Route = createFileRoute('/analysis/$reportID')({
  loader: async ({params: {reportID}}) => fetchMeta(reportID),
  staleTime: 300_000,
  component: ReportRoot
})

function ReportRoot() {
  const {reportID} = Route.useParams();
  const meta = Route.useLoaderData();
  return (<>
      <ReportNav meta={meta} reportID={reportID}/>
      <Outlet/>
      </>
  )
}