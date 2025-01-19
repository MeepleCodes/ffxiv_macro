import { Box, Typography, TypographyProps } from "@mui/material"

export type LabelValueProps = {
  label: string,
  value: string,
  labelVariant?: TypographyProps["variant"],
  variant?: TypographyProps["variant"]
}

export default function LabelValue(props: LabelValueProps) {
  const {label, value, variant="body1"} = props;
  const {labelVariant=variant} = props;
  return (
    <Box sx={{display: "flex", justifyContent: "space-between"}}>
      <Typography
        variant={labelVariant}
        color="textSecondary"
        component="span"
        fontWeight="normal"
        marginRight="1em"
      >
        {label}
      </Typography>
      <Typography
        variant={variant}
        component="span"
      >
        {value}
      </Typography>

    </Box>
  )
}