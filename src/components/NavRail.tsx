import { Box, iconButtonClasses } from "@mui/material";
import { BoxProps } from "@mui/system";

export type NavRailProps = React.PropsWithChildren<{
  variant?: "icon" | "label" | "dynamic"
} & BoxProps>

export default function NavRail(props: NavRailProps) {
  const {variant = "label"} = props;
  return <Box
    sx={[
      {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100%",
      },
      variant === "dynamic" && {
        [`&:hover .${iconButtonClasses.root}`]: {
          width: "72px",
          height: "72px",
          marginTop: 0,
          marginBottom: 0,
          fontSize: "14px"
        }
      },
      variant === "label" && {
        [`& .${iconButtonClasses.root}`]: {
          width: "72px",
          height: "72px",
          marginTop: 0,
          marginBottom: 0,
          fontSize: "14px"
        }
      }
    ]}
    {...props}
  />  
}