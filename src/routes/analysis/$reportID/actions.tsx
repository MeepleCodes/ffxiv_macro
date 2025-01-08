import { createFileRoute } from '@tanstack/react-router'
import { Action } from '../../../excel/Action';
import ReportActionSummary from '../../../components/analysis/ReportActionSummary';
import { fetchActions, fetchMeta, fetchReportActionSummary } from '../../../analysis/fetch';
import React from 'react';
import { getObjectId } from '../../../utils';

export const Route = createFileRoute('/analysis/$reportID/actions')({
  component: ReportActions,
  loader: async ({params: {reportID}}) => fetchReportActionSummary(reportID),
  staleTime: 300_000
});

function ReportActions() {
  const loaderData = Route.useLoaderData();
  
  return (
    <ReportActionSummary summary={loaderData}/>
  )
}