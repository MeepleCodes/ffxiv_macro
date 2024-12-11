import { Box, iconButtonClasses } from "@mui/material";
import { BoxProps } from "@mui/system";

export default function NavRail(props: React.PropsWithChildren<BoxProps>) {
  return <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      height: "100%",
      [`&:hover .${iconButtonClasses.root}`]: {
        width: "72px",
        height: "72px",
        marginTop: 0,
        marginBottom: 0,
        fontSize: "14px"
      }
    }}
    {...props}
  />  
}