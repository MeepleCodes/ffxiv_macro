import { createFileRoute } from '@tanstack/react-router'
import { fetchReportActionSummary } from '../../../supabase/fetch';
import ReportActionSummary from '../../../components/analysis/ReportActionSummary';

export const Route = createFileRoute('/analysis/$reportID/actions')({
  component: ReportActions,
  loader: async ({params: {reportID}}) => fetchReportActionSummary(parseInt(reportID, 10)),
});

function ReportActions() {
  const loaderData = Route.useLoaderData();
  
  return (
    <ReportActionSummary summary={loaderData}/>
  )
}