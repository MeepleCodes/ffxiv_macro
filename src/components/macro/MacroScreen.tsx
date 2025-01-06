import { Box, Button, Card, CardActionArea, CardActions, CardMedia, Divider, FormControl, FormControlLabel, FormGroup, IconButton, InputLabel, MenuItem, Paper, Select, Stack, styled, Switch, Typography } from "@mui/material";

import { MacroFields, macroStore } from "../../firebase/store/Macro"
import React from "react";
import DocToolbar from "../DocToolbar";
import { Sidebar } from "../Sidebar";
import GlyphPicker from "./GlyphPicker";
import TextEditorReact, { HTMLTextEditorElement } from "../../texteditor/TextEditorReact";
import { FontSource, fontSources } from "./fonts";

import { UserDoc } from "../../firebase/store/UserDocStore";
import MenuIcon from '@mui/icons-material/Menu';
import StatusBar, { TEInfo } from "./StatusBar";
import { ThemeContext } from "@emotion/react";

export type MacroScreenProps = {
  doc?: UserDoc<MacroFields>,
  onIdChange?: (id?: string) => void,
};

const StyledTextEditor = styled(TextEditorReact)(({theme}) => ({
  color: theme.palette.text.primary,
  '--whitespace-color': theme.palette.text.disabled,
  
  padding: theme.spacing(0.5, 1),
  border: 0,
  outline: 0,
  flex: 1,
  width: "auto",
  height: "auto",
}));


export default function MacroScreen(props: MacroScreenProps) {
  const {doc = macroStore.new(), onIdChange} = props;
  const [rightOpen, setRightOpen] = React.useState(true);
  
  const [liveDoc, setLiveDoc] = React.useState(doc);

  const [font, setFont] = React.useState(0);
  const [showWhitespace, setShowWhitespace] = React.useState(true);
  const ref = React.useRef<HTMLTextEditorElement|null>(null);
  const [cur, setCur] = React.useState<TEInfo | undefined>();
  const updateCursor = React.useCallback(() => {
    if(ref.current !== null) {
      const {cursorX, cursorY, cursorRow, cursorCol, selectionLength, selectionPixels, columnMode} = ref.current;
      setCur({cursorX, cursorY, cursorRow, cursorCol, selectionLength, selectionPixels, columnMode});
    }
  }, [setCur, ref]);
  React.useEffect(() => {
    updateCursor();
  }, [updateCursor]);
  return <>
    <Stack direction="column" flex={1}>
      <Stack direction="row" flex={0}>
      <DocToolbar
        liveDoc={liveDoc}
        setLiveDoc={setLiveDoc}
        onIdChange={onIdChange}
        store={macroStore}
        sx={{
          p: 0,
          my: 1,
          mx: 6,
          flex: 1,
          overflow: "auto",
          maxHeight: 48,
          gridArea: "toolbar"
        }}
      />
      <IconButton
        size="small"
        onClick={() => {setRightOpen(!rightOpen)}}
        sx={{
          m: 1,
          backgroundColor: (theme) => theme.vars.palette.background.paper,
          ["&:hover"]: {
            backgroundColor: (theme) => `rgba(${theme.vars.palette.dividerChannel} / 0.48)`
          }
        }}
      >
        <MenuIcon />
      </IconButton>
      </Stack>
      <Stack direction="row" flex={1}>
      <Card
        sx={{
          m: 1,
          mt: 0,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          alignItems: "stretch"
        }}
      >
        <CardMedia sx={{flex: 1}}>
        <StyledTextEditor
          ref={ref}
          fontsrc={fontSources[font].src}
          showWhitespace={showWhitespace}
          value={doc.text}
          onChange={(e) => {console.log("Text changed", e); setLiveDoc(doc => ({...doc, text: e.target.value}))}}
          onSelectionChange={updateCursor}
          />
        </CardMedia>
				<CardActions sx={{borderTopColor: (theme) => theme.vars.palette.divider, borderTopWidth: 1, borderTopStyle: "solid"}}>
							<StatusBar info={cur}/>
						</CardActions>
      </Card>

      <Sidebar
        width="420px"
        side="right"
        sx={{
          borderTopLeftRadius: 4,
          borderTopWidth: 1,
          borderRightWidth: 0,
        }}
        open={rightOpen}
        >
          <Stack direction="column" sx={{px: 1, width: "418px"}} spacing={1}>
          <Typography variant="subtitle1" flex={1} sx={{lineHeight: 2}}>Settings</Typography>
					<FormGroup>
						<FormControlLabel 
							labelPlacement="start" 
							checked={showWhitespace}  
							onChange={() => {setShowWhitespace(!showWhitespace)}} 
							control={<Switch/>} 
							slotProps={{typography: {flex: 1}}}
							sx={{ml: 1}}
							label="Show whitespace" 
						/>
					</FormGroup>
					<FormControl size="small" color="inverted">
						<InputLabel sx={{color:"inherit", borderColor: "currentcolor"}} id="font-size">Font size</InputLabel>
						<InputLabel id="font-size">Font size</InputLabel>
						<Select
							labelId="font-size"
							id="font-size"
							value={font.toString()}
							label="Font size"
							onChange={e => {setFont(parseInt(e.target.value))}}
						>
							{fontSources.map((fontSource: FontSource, i: number) => <MenuItem key={fontSource.request} value={i}>{fontSource.name}</MenuItem>)}
						</Select>
					</FormControl>
          </Stack>
          <Divider orientation="horizontal" sx={{my: 1}}/>
        <GlyphPicker
          editorRef={ref}
          fontsrc={fontSources[font].src}
        />
      </Sidebar>
      </Stack>
    </Stack>
  </>
}