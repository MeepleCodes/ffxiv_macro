import { Box, List, ListItem,  ListItemText, ListSubheader, Paper } from '@mui/material';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import ViewTimelineIcon from '@mui/icons-material/ViewTimeline';
import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts';

import { useMatchRoute } from '@tanstack/react-router'
import { ListItemButtonLink } from '../../components/Links';
import dayjs from 'dayjs';
import { Route as ReportRoute } from "./$reportID";
import { Route as ActionsRoute } from "./$reportID/actions";
import { Route as FightRoute } from "./$reportID/$fightID";
import { Route as TimelineRoute } from "./$reportID/timeline";
import ReportNavLink from './-ReportNavLink';
import { Report } from '../../analysis/types';

export type FightListParams = {
  report: Report
}

export default function ReportNav(params: FightListParams) {
  const matchRoute = useMatchRoute();
  const { report } = params;
  const reportID = `${report.id}`;
  return (<>
    <Box
      sx={{
        width: 58,
        height: "100%",
        position: "relative",
        overflow: "overflow",
        flexShrink: 0
      }}
    >
      <Paper
        square
        elevation={2}
        sx={{
          height: "100%",
          position: "absolute",
          overflowX: "hidden",
          overflowY: "scroll",
          scrollbarWidth: "thin",
          zIndex: (theme) => theme.vars.zIndex.drawer,
          ["&:hover .MuiList-root"]: {
            width: 200,
            transition: (theme) => theme.transitions.create(['width'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            })
          }
        }}
      >
        <List
          dense
          sx={{
            // overflowY: "scroll",
            overflow: "hidden",
            // height: "100%",
            width: (theme) => theme.spacing(6),
            transition: (theme) => theme.transitions.create(['width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            })
          }}
        >
          <ReportNavLink
            primary="Summary"
            to={ReportRoute.to}
            params={{reportID}}
            icon={<TroubleshootIcon/>}
          />
          <ReportNavLink
            primary="Actions"
            to={ActionsRoute.to}
            params={{reportID}}
            icon={<SportsMartialArtsIcon/>}
          />
          <ReportNavLink
            primary="Timeline"
            to={TimelineRoute.to}
            params={{reportID}}
            icon={<ViewTimelineIcon/>}
          />
          
          <ListSubheader
            disableGutters
            sx={{
              fontVariant: "small-caps",
              textAlign: "center",
              fontSize: "14px",
              lineHeight: (theme) => theme.spacing(2),
              mt: 1
            }}
          >
            Fights
          </ListSubheader>
          {report.fights.map((fight, idx) => {
            <ReportNavLink
              key={fight.id}
              to={FightRoute.to}
              params={{reportID, fightID: fight.id.toString()}}
              primary={fight.name}
              secondary={`${dayjs.duration(fight.combatTime, "milliseconds").format("mm:ss")} ${fight.bossPercentage}%`}
              icon={fight.id.toString()}
            />
            const toParams = { reportID, fightID: `${idx + 1}` };
            return <ListItem disablePadding dense key={idx}>
              <ListItemButtonLink
                to="/analysis/$reportID/$fightID"
                params={toParams}
                key={idx}
                selected={matchRoute({ to: "/analysis/$reportID/$fightID", params: toParams, fuzzy: true }) !== false}
                sx={{
                  position: "relative",
                  "&.active .ActiveMarker": {
                    visibility: "visible"
                  }
                }}
              >
                <Box sx={{ width: (theme) => theme.spacing(2), mr: (theme) => theme.spacing(2), flexShrink: 0, textAlign: "center" }}>{idx + 1}</Box>
                <ListItemText
                  primary={fight.name}
                  primaryTypographyProps={{ noWrap: true }}
                  secondary={`${dayjs.duration(fight.combatTime, "milliseconds").format("mm:ss")} ${fight.bossPercentage}%`}
                  secondaryTypographyProps={{ noWrap: true }}
                  sx={{
                    mr: "2px"
                  }}
                />
                <Box
                  className="ActiveMarker"
                  sx={{
                    borderColor: (theme) => theme.vars.palette.primary.main,
                    borderRightWidth: 2,
                    borderRightStyle: "solid",
                    position: "absolute",
                    right: 0,
                    top: 0,
                    bottom: 0,
                    visibility: "hidden"
                  }}
                />
              </ListItemButtonLink>
            </ListItem>
          }
          )}
        </List>
      </Paper>
    </Box>
  </>)
}