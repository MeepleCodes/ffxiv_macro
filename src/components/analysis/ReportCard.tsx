import { Box, Link, Stack, StackProps, Typography } from "@mui/material"
import { Report } from "../../analysis/types"
import { RouteLink } from "../Links"

import { Route as ReportIDRoute } from '../../routes/analysis/$reportID';
import TextLabel from "./TextLabel";

export type ReportCardProps = StackProps & {
  report: Report
}
export default function ReportCard({report, ...rest}: ReportCardProps) {
  return <Stack direction="column" {...rest}>
      <Typography variant="overline" display="flex" sx={{lineHeight: "inherit", textWrap: "nowrap"}}>
      <TextLabel fontWeight="normal">Report ID</TextLabel>
        <RouteLink
          to={ReportIDRoute.to}
          params={{reportID: report.id}}
          fontWeight="bold"
          underline="hover"
        >
          {report.id}
        </RouteLink>
        <Box sx={{flex: 1, minWidth: (theme) => theme.spacing(2)}}/>
        <TextLabel fontWeight="normal">FFLogs</TextLabel>
        <Link
          href={`https://fflogs.com/reports/${report.code}`}
          target="_blank"
          fontWeight="bold"
          underline="hover"
        >
          {report.code}
        </Link>
      </Typography>
      <Typography variant="h5">{report.title}</Typography>
      <Typography variant="subtitle2">
        <TextLabel fontWeight="normal">Uploaded</TextLabel> {report.endTime.toString()}
      </Typography>
      <Typography variant="subtitle2">
        <TextLabel fontWeight="normal">Analysed</TextLabel> {report.createdAt.toString()}
      </Typography>      
  </Stack>
}