import { Box, Button, Card, IconButton, Paper, styled } from "@mui/material";

import { MacroFields, macroStore } from "../../firebase/store/Macro"
import React from "react";
import DocToolbar from "../DocToolbar";
import { Sidebar } from "../Sidebar";
import GlyphPicker from "./GlyphPicker";
import TextEditorReact, { HTMLTextEditorElement } from "../../texteditor/TextEditorReact";
import { fontSources } from "./fonts";

import { UserDoc } from "../../firebase/store/UserDocStore";
import DocList, { SortMode } from "../DocList";
import { MacroDisplayList } from "./MacroListList";
import { MacroDisplayPreviews } from "./MacroListPreview";


export type MacroScreenProps = {
  doc?: UserDoc<MacroFields>,
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
  
  const [rightOpen, setRightOpen] = React.useState(true);
  const {doc: initialDoc = macroStore.new(), onIdChange} = props;
  const [liveDoc, setLiveDoc] = React.useState(initialDoc);
  const [font, setFont] = React.useState(0);
  let ref = React.useRef<HTMLTextEditorElement|null>(null);
  return <>
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
          value={liveDoc.text}
          onChange={(e) => {setLiveDoc(doc => ({...doc, text: e.currentTarget.value}))}}
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
  </>
}