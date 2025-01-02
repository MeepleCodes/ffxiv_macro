import { Box, Button, Card, IconButton, Paper, styled } from "@mui/material";

import { MacroDoc, macroStore } from "../../firebase/store/Macro"
import React from "react";
import DocToolbar from "../DocToolbar";
import { Sidebar } from "../Sidebar";
import GlyphPicker from "./GlyphPicker";
import TextEditorReact, { HTMLTextEditorElement } from "../../texteditor/TextEditorReact";
import { fontSources } from "./fonts";
import MenuIcon from '@mui/icons-material/Menu';

export type MacroScreenProps = {
  doc?: MacroDoc,
  onIdChange?: (id?: string) => void,
};

const StyledTextEditor = styled(TextEditorReact)(({theme}) => ({
  color: theme.palette.text.primary,
  '--whitespace-color': theme.palette.text.disabled,
  width: 400,
  height: 400,
  padding: theme.spacing(0.5, 1),
  border: 0,
  outline: 0
}));


export default function MacroScreen(props: MacroScreenProps) {
  const [leftOpen, setLeftOpen] = React.useState(true);
  const [rightOpen, setRightOpen] = React.useState(true);
  const {doc: initialDoc = macroStore.new(), onIdChange} = props;
  const [liveDoc, setLiveDoc] = React.useState(initialDoc);
  const [font, setFont] = React.useState(0);
  let ref = React.useRef<HTMLTextEditorElement|null>(null);
  return <>
    <Box
      sx={{
        display: "grid",
        height: "100%",
        gridTemplateRows: "56px 1fr",
        gridTemplateColumns: `min-content 56px minmax(min-content, 1fr) min-content 56px`,
        gridTemplateAreas: `"leftdrawer leftmenu   toolbar     toolbar     rightmenu"
                            "leftdrawer main       main        rightdrawer rightdrawer"`        
      }}
    >
      <Sidebar
        side="left"
        width="300px"
        open={leftOpen}
        sx={{
          gridArea: "leftdrawer"
        }}
      >
        Left nav
      </Sidebar>
      <Box
        sx={{
          gridArea: "leftmenu",
          display: "flex",
          alignItems: "center",
          flexDirection: "row"
        }}
        >

      <IconButton
        size="small"
        onClick={() => {setLeftOpen(!leftOpen)}}
        sx={{
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          backgroundColor: (theme) => theme.vars.palette.background.paper,
          ["&:hover"]: {
            backgroundColor: (theme) => `rgba(${theme.vars.palette.dividerChannel} / 0.48)`
          }
        }}
      >
        <MenuIcon />
      </IconButton>
      </Box>
      <DocToolbar
        liveDoc={liveDoc}
        setLiveDoc={setLiveDoc}
        onIdChange={onIdChange}
        store={macroStore}
        sx={{
          p: 0,
          m: 1,
          overflow: "auto",
          maxHeight: 56,
          gridArea: "toolbar"
        }}
      />

      <Card sx={{m: 1, mt: 0, display: "flex", flexDirection: "column", gridArea: "main", alignItems: "stretch"}}>
        <StyledTextEditor
          ref={ref}
          fontsrc={fontSources[font].src}
          />
      </Card>
      <Sidebar
        width="auto"
        side="right"
        sx={{
          gridArea: "rightdrawer",
          borderTopLeftRadius: 4,
          borderTopWidth: 1,
          borderRightWidth: 0
        }}
        open={rightOpen}
        >
        <GlyphPicker
          editorRef={ref}
          fontsrc={fontSources[font].src}
        />
      </Sidebar>
    </Box>
  </>
}