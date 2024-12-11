import { Box, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Paper } from '@mui/material';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import ViewTimelineIcon from '@mui/icons-material/ViewTimeline';
import { useMatchRoute } from '@tanstack/react-router'
import { ListItemButtonLink } from '../../components/Links';
import dayjs from 'dayjs';
import { Report } from '../../fflogs/reports';
import { Route as ReportRoute } from "./$reportID";
import { Route as TimelineRoute } from "./$reportID/timeline";

export type FightListParams = {
  meta: Report,
  reportID: string
}

export default function ReportNav(params: FightListParams) {
  const matchRoute = useMatchRoute();
  const {meta, reportID} = params;
  return (<>
    <Box
      sx={{
        width: 60,
        height: "100%",
        position: "relative"
      }}
    >
      <Paper
        square
        elevation={2}
        sx={{
          height: "100%",
          position: "absolute",
          overflow: "hidden",
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
            overflowY: "scroll",
            overflowX: "overflow",
            height: "100%",
            width: 60,
            transition: (theme) => theme.transitions.create(['width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            })            
          }}
          >
            <ListItem dense disablePadding>
              <ListItemButtonLink
                to={ReportRoute.to}
                params={{reportID}}
                activeOptions={{exact: true}}
                sx={{
                  position: "relative",
                  "&.active .ActiveMarker": {
                    visibility: "visible"
                  }
                }}
              >
                <ListItemIcon sx={{ml: -0.5}}>
                <TroubleshootIcon/>
                </ListItemIcon>
                <ListItemText primary="Summary" sx={{ml: -2.5}}/>
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
            <ListItem dense disablePadding>
              <ListItemButtonLink
                to={TimelineRoute.to}
                params={{reportID}}
                sx={{
                  position: "relative",
                  "&.active .ActiveMarker": {
                    visibility: "visible"
                  }
                }}
              >
                <ListItemIcon sx={{ml: -0.5}}>
                <ViewTimelineIcon/>
                </ListItemIcon>
                <ListItemText primary="Timeline" sx={{ml: -2.5}}/>
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
          {meta.fights.map((fight, idx) => {
            const toParams = {reportID, fightID: `${idx+1}`};
            return <ListItem disablePadding dense key={idx}>
                <ListItemButtonLink
                  to="/analysis/$reportID/$fightID"
                  params={toParams}
                  key={idx}
                  selected={matchRoute({to: "/analysis/$reportID/$fightID", params: toParams, fuzzy: true}) !== false}
                  sx={{
                    position: "relative",
                    "&.active .ActiveMarker": {
                      visibility: "visible"
                    }
                  }}
                >
                  <Box sx={{width: (theme) => theme.spacing(2), mr: (theme) => theme.spacing(2), flexShrink: 0, textAlign: "center"}}>{idx+1}</Box>
                  <ListItemText
                    primary={fight.name}
                    primaryTypographyProps={{noWrap: true}}
                    secondary={`${dayjs.duration(fight.combatTime, "milliseconds").format("mm:ss")} ${fight.bossPercentage}%`}
                    secondaryTypographyProps={{noWrap: true}}
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