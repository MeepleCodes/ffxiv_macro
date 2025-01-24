import { Box } from "@mui/material";

export type PreviewProps = {
  className?: string;
  mask: string;
  textColor?: string;
  small?: boolean;
}

export default function Preview({small, textColor, mask}: PreviewProps) {

  const size = small === true ? 10 : 20;
  return (
    <Box sx={{width: "100%"}}>
      <Box
        sx={{
          width: '100%',
          background: (theme) => textColor ?? theme.palette.text.secondary,
          maskComposite: 'source-in',
          maskRepeat: 'no-repeat',
          ...(small === true ? {
              aspectRatio: '1',
              maskImage: `url(${mask}), ` + (["top", "left"].map(edge => `linear-gradient(to ${edge}, transparent, black ${size}px)`)).join(", "),
          } : {
              aspectRatio: '3/2',
              maskImage: `url(${mask}), linear-gradient(to bottom, black calc(100% - 80px), transparent calc(100% - 20px), transparent), linear-gradient(to right, black calc(100% - 20px), transparent)`,
          })
        }}
      />
    </Box>
  )
}
