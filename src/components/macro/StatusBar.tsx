import { Box, BoxProps } from "@mui/material";
import React from "react";

export type TEInfo = {
	cursorX: number,
	cursorY: number,
	cursorRow: number,
	cursorCol: number,
	selectionLength: number,
	selectionPixels: number | undefined,
	columnMode: boolean,
};

export type StatusBarProps = BoxProps & {
  info?: TEInfo
}

export default function StatusBar(props: StatusBarProps) {
  const {info, ...rest} = props;
  const selectionText = React.useMemo(() => {
    if(info !== undefined && info.selectionLength > 0) {
      const px = info.selectionPixels == undefined ? "" : `, ${info.selectionPixels}px`;
      return `(${info.selectionLength} selected${px})`
    }
  }, [info]);
  return (
    <Box {...rest}>
      {info &&
        <>Ln {info.cursorRow}, Col {info.cursorCol} [{info.cursorX}, {info.cursorY}] {selectionText} {info.columnMode && "COL"}</>
      }
    </Box>
  )
}