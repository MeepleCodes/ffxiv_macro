import * as React from 'react';
import { NumberField } from '@base-ui-components/react/number-field';
import { styled, Theme } from '@mui/material';
import numberInputClasses from './numberInputClasses';

export type NumberInputProps = NumberField.Root.Props & {
  label?: string,
  digits?: number,
  width?: React.CSSProperties["width"],
  blurOnEnter?: boolean
};

const Root = styled(NumberField.Root)(({theme}) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: theme.vars.spacing
}));
const ScrubArea = styled(NumberField.ScrubArea)({
  cursor: "ew-resize",
  userSelect: "none",
  display: "flex",
  flex: 1,
  flexDirection: "column" 
});
const ScrubAreaCursor = styled(NumberField.ScrubAreaCursor)(({theme}) => ({
  filter: `drop-shadow(${theme.vars.shadows[1]})`
}));
const Label = styled("label")(({theme}) => ({
  cursor: "ew-resize",
  color: theme.vars.palette.text.secondary,
  flex: 1
}));
const ScrubBar = styled("div")(({theme}) => ({
  flexShrink: 0,
  flexGrow: 0,
  height: `calc(${theme.vars.spacing} / 4)`,
  position: "relative",
  background: `rgba(${theme.vars.palette.background.defaultChannel} / 0.2)`
}));
const ScrubProgress=styled("div", {shouldForwardProp: (name) => name !== "progress"})<{progress: number}>(({theme, progress}) => ({
  background: theme.vars.palette.text.secondary,
  height: "100%",
  width: `${progress*100}%`
}));
const Group = styled(NumberField.Group)(({theme}) => ({
  display: "flex",
  boxSizing: "border-box",
  alignItems: "stretch",
  justifyContent: "center",
  height: `calc(${theme.vars.spacing} * 4)`,
  margin: 0,
  outline: 0,
  padding: 0,
  paddingLeft: theme.vars.spacing,
  paddingRight: theme.vars.spacing,
  gap: theme.vars.spacing,
  border: `1px solid rgba(${theme.vars.palette.common.onBackgroundChannel} / 0.23)`,
  paddingInline: "1px",
  borderRadius: theme.vars.shape.borderRadius,
  color: "inherit",
  "@media(hover: hover)": {
    "&:hover": {
      borderColor: theme.vars.palette.text.primary,
    }
  },
  "&:has(input:focus)": {
    borderWidth: 2,
    paddingInline: 0,
    borderColor: theme.vars.palette.primary.main
  }  
}));

const Input = styled(NumberField.Input, {shouldForwardProp: propName => propName != "width"})<{width: React.CSSProperties["width"]}>(({width}) => ({
  flex: 1,
  border: 0,
  outline: 0,
  background: "none",
  width
}));

const buttonBaseStyle: (theme: Theme) => React.CSSProperties = (theme: Theme) => ({
  userSelect: "none",
  flex: "0 0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderStyle: "solid",
  borderColor:  `rgba(${theme.vars.palette.common.onBackgroundChannel} / 0.23)`,
  boxSizing: "content-box",
  background: "none",
  borderWidth: 0,
  padding: 0,
  width: `calc(${theme.vars.spacing} * 2)`,
  minWidth: `calc(${theme.vars.spacing} * 2)`
});

const Decrement = styled(NumberField.Decrement)(({theme}) => ({
  ...buttonBaseStyle(theme),
  borderRightWidth: "1px",
  
}));
const Increment = styled(NumberField.Increment)(({theme}) => ({
  ...buttonBaseStyle(theme),
  borderLeftWidth: "1px",
  
}));

export default function NumberInput(props: NumberInputProps) {
  const {
    width,
    label,
    digits,
    blurOnEnter = true,
    format = digits !== undefined ?
      {minimumFractionDigits: digits, maximumFractionDigits: digits} :
      undefined,
    ...rest
  } = props;
  const id = React.useId();
  const keyDown = blurOnEnter === true ? (e: React.KeyboardEvent<HTMLInputElement>) => {if(e.key === "Enter") e.currentTarget.blur()} : undefined;
  return (
    <Root id={id} format={format} {...rest} className={numberInputClasses.root}>
      <ScrubArea className={numberInputClasses.scrubArea}>
        <Label htmlFor={id}>{label}</Label>
        <ScrubAreaCursor>
          
          <CursorGrowIcon />
        </ScrubAreaCursor>
        {rest.min !== undefined && rest.max !== undefined && rest.value !== null && rest.value !== undefined &&
          <ScrubBar>
            <ScrubProgress
              progress={(rest.value - rest.min)/ (rest.max-rest.min)}
            />
          </ScrubBar>
        }
      </ScrubArea>

      <Group className={numberInputClasses.group}>
        <Decrement>
          <MinusIcon />
        </Decrement>
        <Input width={props.width} className={numberInputClasses.input} onKeyDown={keyDown}/>
        <Increment>
          <PlusIcon />
        </Increment>
      </Group>
    </Root>
  );
}

function CursorGrowIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="26"
      height="14"
      viewBox="0 0 24 14"
      fill="black"
      stroke="white"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M19.5 5.5L6.49737 5.51844V2L1 6.9999L6.5 12L6.49737 8.5L19.5 8.5V12L25 6.9999L19.5 2V5.5Z" />
    </svg>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.6"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 5H5M10 5H5M5 5V0M5 5V10" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.6"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 5H10" />
    </svg>
  );
}
