import { createFileRoute, Outlet } from '@tanstack/react-router'
import ReportNav from './-ReportNav';
import { fetchReport } from '../../supabase/fetch';

export const Route = createFileRoute('/analysis/$reportID')({
  loader: async ({params: {reportID}}) => await fetchReport(parseInt(reportID, 10)),
  staleTime: 300_000,
  component: ReportRoot
})

function ReportRoot() {
  const report = Route.useLoaderData();
  return (<>
      <ReportNav report={report}/>
      <Outlet/>
      </>
  )
}