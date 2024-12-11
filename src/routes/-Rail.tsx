import { Box } from "@mui/system";
import DescriptionIcon from '@mui/icons-material/Description';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import FollowTheSignsIcon from '@mui/icons-material/FollowTheSigns';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';

import UserMenu from "../components/UserMenu";
import NavRailButton from "../components/NavRailButton";
import { Route as NotesRoute } from "./notes";
import { Route as PlansRoute } from "./plans";
import { Route as AnalysisRoute } from "./analysis";
import NavRail from "../components/NavRail";


export default function Rail() {
  return <>
    <NavRail>
      <NavRailButton
          to="/"
        >
        <LooksOneIcon/>
        Macros
      </NavRailButton>
      <NavRailButton
        to={NotesRoute.fullPath}
      >
        <DescriptionIcon/>
        Notes
      </NavRailButton>
      <NavRailButton
        to={PlansRoute.fullPath}
      >
        <FollowTheSignsIcon/>
        Plans
      </NavRailButton>
      <NavRailButton to={AnalysisRoute.fullPath}>
        <TroubleshootIcon/>
        Analysis
      </NavRailButton>
      <Box sx={{flex: 1}}/>
      <UserMenu sx={{          width: "56px",
          height: "56px",
          transition: "width 300ms, height 300ms, gap 300ms, font-size 300ms",}}
      />
    </NavRail>
  </>
}