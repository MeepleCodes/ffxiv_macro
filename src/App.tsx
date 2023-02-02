import { useEffect, useRef, useState } from 'react';
import './App.css';
import TextEditor, {HTMLTextEditorElement} from './texteditor/TextEditorReact';
import { StoreContextProvider, SaveIconButton, SimpleFileName } from './firebase/store/StoreControls';
import { StyledFileList } from './firebase/store/MacroList';
import GlyphPicker from './GlyphPicker';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

import { NavDrawer, NavMain } from './Nav';
import { appTheme } from './Theme';

import log, {RootLogger} from 'loglevel';
import AuthMenu from './firebase/auth/AuthControls';

import {
    Box,
    Card,
    IconButton,
    Typography,
    InputLabel,
    MenuItem,
    FormControl,
	FormControlLabel,
	FormGroup,
    Select,
    CardActions,
    CardMedia,
    CardHeader,
    Stack,
	Switch,
	CssBaseline,
	Divider
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

declare global {
	interface Window { log: RootLogger }
}
window.log = log;
log.setLevel(log.levels.DEBUG);

const DRAWER_WIDTH = 300;

type FontSource = {
	name: string;
	size: string;
	src: string;
	request: string;
}
const fontSources: FontSource[] = [];

function importRes(requireContext: __WebpackModuleApi.RequireContext, cache = false) {
	requireContext.keys().forEach((request) => {
		const src = requireContext(request);
		if(cache) {
				const parts = (request.startsWith("./") ? request.substring(2) : request).split(/[-.]/).slice(0,2);
				const name = parts[0].charAt(0).toUpperCase() + parts[0].substring(1) + " " + parts[1];
				const size = parts[1];
				fontSources.push({name, size, src, request});
		}
		
	});
}

importRes(require.context('./res/', true, /\.png$/), false);
importRes(require.context('./res/', true, /-combined\.json$/), true);

type TEInfo = {
	cursorX: number,
	cursorY: number,
	cursorRow: number,
	cursorCol: number,
	selectionLength: number,
	selectionPixels: number | null,
	columnMode: boolean,
};

const StyledTextEditor = styled(TextEditor, {shouldForwardProp: () => true})(({theme}) => ({
    color: theme.palette.text.primary,
    '--whitespace-color': theme.palette.text.disabled,
	width: 400,
	height: 400,
	padding: theme.spacing(0.5, 1),
	border: 0,
	outline: 0
}));

function App() {
	let [font, setFont] = useState<number>(0);
	let [cur, setCur] = useState<TEInfo | undefined>();
	let [open, setOpen] = useState<boolean>(true);
	let [showWhitespace, setShowWhitespace] = useState<boolean>(true);
    let ref = useRef<HTMLTextEditorElement>(null);

    const updateCursor = (ev: {target: any}) => {
        const t = ev.target as HTMLTextEditorElement;
        setCur({
            cursorX: t.cursorX,
            cursorY: t.cursorY,
            cursorRow: t.cursorRow,
            cursorCol: t.cursorCol,
            selectionLength: t.selectionLength,
            selectionPixels: t.selectionPixels,
			columnMode: t.columnMode
        });
    };
	let selectionText = "";
	if(cur && cur.selectionLength > 0) {
		if(cur.selectionPixels !== null) {
			selectionText = `(${cur.selectionLength} selected, ${cur.selectionPixels}px)`;
		} else {
			selectionText = `(${cur.selectionLength} selected)`;
		}
		
	}
	useEffect(() => {
		if(ref.current !== null && cur === undefined) updateCursor({target: ref.current});
	})

	return (
		<StoreContextProvider editor={ref}>
			<ThemeProvider theme={appTheme}>
				<CssBaseline/>
				<div id="bg"/>
				<IconButton
					color="inherit"
					aria-label="open drawer"
					onClick={e => setOpen(!open)}
					sx={{
						position: "absolute",
						top: 2,
						left: 2,
						...(open && { display: 'none' })
					}}
				>
					<MenuIcon />
				</IconButton>
					

			<NavDrawer variant="persistent" anchor="left" open={open} width={DRAWER_WIDTH}>
				<Stack direction="column" height="100%" p={1}>
					<Stack direction="row" justifyItems="top">
						<Typography variant="h6" flex={1} sx={{lineHeight: 2}}>Don't Stand In Bad</Typography>
						<AuthMenu/>
						<IconButton
							color="inherit"
							aria-label="close drawer"
							onClick={e => setOpen(!open)}
						>
							<CloseIcon />
						</IconButton>
						
					</Stack>
					<Stack direction="column" alignItems="stretch" spacing={1}>
						<Typography variant="subtitle1" flex={1} sx={{lineHeight: 2}}>Settings</Typography>
					<FormGroup>
					<FormControlLabel 
						labelPlacement="start" 
						checked={showWhitespace}  
						onChange={() => setShowWhitespace(!showWhitespace)} 
						control={<Switch/>} 
						// sx={{justifyContent: "flex-end"}}
						slotProps={{typography: {flex: 1}}}
						sx={{ml: 1}}
						label="Show whitespace" 
						// label={<><SpaceBarIcon /> Show whitespace</>}
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
							onChange={e => setFont(parseInt(e.target.value))}
						>
							{fontSources.map((fontSource: FontSource, i: number) => <MenuItem key={fontSource.request} value={i}>{fontSource.name}</MenuItem>)}
						</Select>
					</FormControl>
					</Stack>
					<Divider variant="middle" sx={{m:1}}/>
					<Box sx={{overflow: "auto", mx: -1}} >
						<StyledFileList/>
					</Box>
				</Stack>
			</NavDrawer>
			<NavMain open={open}>
				<Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
					<Card sx={{display: "flex", flexDirection: "column"}}>
						<CardHeader sx={{boxShadow: 1}} title={(
							<Stack direction="row">
								<SimpleFileName/>
								<SaveIconButton/>
								<SaveIconButton asCopy={true}/>
							</Stack>
						)}/>
						<CardMedia>
							<StyledTextEditor fontsrc={fontSources[font].src} ref={ref} onSelectionChange={updateCursor} showWhitespace={showWhitespace} value={"line\n\nline"}/>
						</CardMedia>
						<CardActions sx={{boxShadow: 1}}>
							{cur && <div className="status row">
								Ln {cur.cursorRow}, Col {cur.cursorCol} [{cur.cursorX}, {cur.cursorY}] {selectionText} {cur.columnMode && "COL"}
							</div>}
						</CardActions>
					</Card>
					<GlyphPicker editorRef={ref} fontsrc={fontSources[font].src}/>
				</Stack>
			</NavMain>
			</ThemeProvider>
		 </StoreContextProvider>
		
	);
}

export default App;
