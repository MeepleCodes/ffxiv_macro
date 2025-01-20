import { Box, Card, CardActions, CardMedia, IconButton, InputAdornment, MenuItem, Select, Stack, styled, ToggleButton, Tooltip, Typography } from "@mui/material";

import { MacroDoc, macroStore } from "../../supabase/Macro"
import React from "react";
import DocToolbar from "../DocToolbar";
import { Sidebar } from "../Sidebar";
import GlyphPicker from "./GlyphPicker";
import TextEditorReact, { HTMLTextEditorElement } from "../../texteditor/TextEditorReact";
import { FontSource, fontSources } from "./fonts";

import MenuIcon from '@mui/icons-material/Menu';
import FormatSizeIcon from '@mui/icons-material/FormatSize';

export type MacroScreenProps = {
  doc?: MacroDoc,
  onIdChange?: (id?: string) => void,
};

const StyledTextEditor = styled(TextEditorReact)(({ theme }) => ({
  color: theme.palette.text.primary,
  '--whitespace-color': theme.palette.text.disabled,

  padding: theme.spacing(0.5, 1),
  border: 0,
  outline: 0,
  flex: 1,
  width: "auto",
  height: "auto",
  overflow: "auto"
}));

export type TEInfo = {
	cursorX: number,
	cursorY: number,
	cursorRow: number,
	cursorCol: number,
	selectionLength: number,
	selectionPixels: number | undefined,
	columnMode: boolean,
};


export default function MacroScreen(props: MacroScreenProps) {
  const { doc = macroStore.new(), onIdChange } = props;
  const [rightOpen, setRightOpen] = React.useState(true);

  const [liveDoc, setLiveDoc] = React.useState(doc);

  const [font, setFont] = React.useState(0);
  const [showWhitespace, setShowWhitespace] = React.useState(true);
  const ref = React.useRef<HTMLTextEditorElement | null>(null);
  const [cursorInfo, setCursorInfo] = React.useState<TEInfo | undefined>();
  const updateCursor = React.useCallback(() => {
    if (ref.current !== null) {
      const { cursorX, cursorY, cursorRow, cursorCol, selectionLength, selectionPixels, columnMode } = ref.current;
      setCursorInfo({ cursorX, cursorY, cursorRow, cursorCol, selectionLength, selectionPixels, columnMode });
    }
  }, [setCursorInfo, ref]);
  React.useEffect(() => {
    updateCursor();
  }, [updateCursor]);
  const cursorText = React.useMemo(() => {
    if(cursorInfo !== undefined) {
      let selectionText = "";
      if(cursorInfo.selectionLength > 0) {
        const px = cursorInfo.selectionPixels == undefined ? "" : `, ${cursorInfo.selectionPixels}px`;
        selectionText = `(${cursorInfo.selectionLength} selected${px})`
      }
      return `Ln ${cursorInfo.cursorRow}, Col ${cursorInfo.cursorCol}, [${cursorInfo.cursorX}, ${cursorInfo.cursorY}] px ${selectionText}${cursorInfo.columnMode ? " COL" : ""}`;
    } else {
      return "";
    }
    
  }, [cursorInfo]);

  return <>
    <Stack direction="column" flex={1} overflow="hidden">
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
          onClick={() => { setRightOpen(!rightOpen) }}
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
      <Stack direction="row" flex={1} overflow="hidden">
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
          <CardMedia sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <StyledTextEditor
              ref={ref}
              fontsrc={fontSources[font].src}
              showWhitespace={showWhitespace}
              value={doc.text}
              onChange={(e) => { console.log("Text changed", e); setLiveDoc(doc => ({ ...doc, text: e.target.value })) }}
              onSelectionChange={updateCursor}
            />
          </CardMedia>
          <CardActions
            sx={{
              borderTopColor: (theme) => theme.vars.palette.divider,
              borderTopWidth: 1,
              borderTopStyle: "solid",
              px: 0,
              py: 0,
              height: "30px",
              display: "flex",
              flexDirection: "row",
              overflow: "hidden",
            }}
            // disableSpacing
          >
              <Tooltip title="Font size">
                <Select
                  id="font-size"
                  value={font.toString()}
                  variant="standard"
                  onChange={e => { setFont(parseInt(e.target.value)) }}
                  startAdornment={
                    <InputAdornment position="start" sx={{pointerEvents: "none", position: "absolute", left: "4px"}}><FormatSizeIcon fontSize="small"/></InputAdornment>
                  }
                  sx={{
                    font: (theme) => theme.vars.font.caption,
                    alignSelf: "stretch",
                    "&:hover": {
                      background: (theme) => theme.vars.palette.FilledInput.hoverBg
                    },
                    "&:hover:not(.Mui-disabled, .Mui-error):before": {
                      borderBottom: 0
                    },
                    "&:before": {
                      borderBottom: 0
                    },
                    "&:after": {
                      borderBottom: 0
                    },
                    "& .MuiInputBase-input": {
                      py: 0,
                      px: 3.5,
                      m: 0,
                      border: 0
                    }
                  }}
                >
                  {fontSources.map((fontSource: FontSource, i: number) => <MenuItem key={fontSource.request} value={i}>{fontSource.size}pt</MenuItem>)}
                </Select>
              </Tooltip>
              <Tooltip title="Show/hide visible whitespace characters">
                <ToggleButton value="true" selected={showWhitespace} onChange={() => {setShowWhitespace(!showWhitespace)}} sx={{fontFamily: "Arial, Helvetica, Sans-serif"}}>
                  ¶
                </ToggleButton>
              </Tooltip>
            <Box flex={1}/>
            <Typography sx={{mx: 1}} variant="caption">{cursorText}</Typography>
          </CardActions>
        </Card>

        <Sidebar
          width="420px"
          side="right"
          sx={{
            borderTopLeftRadius: 4,
            borderTopWidth: 1,
            borderRightWidth: 0,
            display: "flex",
            flexDirection: "column"
          }}
          open={rightOpen}
        >
          <GlyphPicker
            editorRef={ref}
            fontsrc={fontSources[font].src}
            sx={{flex: 1, overflow: "hidden"}}
          />
        </Sidebar>
      </Stack>
    </Stack>
  </>
}