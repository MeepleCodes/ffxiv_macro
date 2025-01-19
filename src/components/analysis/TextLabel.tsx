import { Typography, TypographyProps } from "@mui/material";

export type TextLabelProps = TypographyProps & {
  side?: "left"|"right"
}

export default function TextLabel(props: TextLabelProps) {
  const {side="left", ...rest} = props;
  return <Typography
    variant="inherit"
    color="textSecondary"
    component="span"
    marginRight={side === "left" ? 1 : 0}
    marginLeft={side === "left" ? 0 : 1}
    {...rest}
  />
}