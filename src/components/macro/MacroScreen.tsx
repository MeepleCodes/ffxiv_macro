import { Card } from "@mui/material";

import { MacroDoc, macroStore } from "../../firebase/store/Macro"
import React from "react";
import DocToolbar from "../DocToolbar";

export type MacroScreenProps = {
  doc?: MacroDoc,
  onIdChange?: (id?: string) => void,
};


export default function MacroScreen(props: MacroScreenProps) {
  const {doc: initialDoc = macroStore.new(), onIdChange} = props;
  const [liveDoc, setLiveDoc] = React.useState(initialDoc);
  return <>
    <DocToolbar
      liveDoc={liveDoc}
      setLiveDoc={setLiveDoc}
      onIdChange={onIdChange}
      store={macroStore}
      sx={{
      p: 0,
      m: 1,
    }}/>

    <Card sx={{m: 1, mt: 0, display: "flex", flexDirection: "column", gridArea: "main"}}>
      
      <textarea style={{flex: 1, resize: "none", padding: 4, borderRadius: 4, backgroundColor: "transparent" }} value={liveDoc.body} onChange={(e) => {setLiveDoc((doc) => ({...doc, body: e.target.value}))}}/>
    </Card>
    {/*<GlyphPicker editorRef={ref} fontsrc={fontSources[font].src}/>*/}
  </>
}