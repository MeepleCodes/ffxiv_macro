/**
 * A hidden file input element that you can use inside a button with
 * `component='label'`, per
 * https://mui.com/material-ui/react-button/#file-upload.
 * 
 * Use like
 * ```
 * <Button component="label">
 *  Upload files
 *  <HiddenFileInput onChange={handler}/>
 * </Button>
 * ```
 */
import { styled } from "@mui/material";
import React from "react";

const HiddenFileInput = styled((props: Omit<React.HTMLAttributes<HTMLInputElement>, "type">) => <input {...props} type="file"/>)({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});
export default HiddenFileInput;