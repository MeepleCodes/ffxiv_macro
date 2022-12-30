import { useEffect, useRef, useState } from 'react';
import './App.css';
import TextEditor, {HTMLTextEditorElement} from './texteditor/TextEditorReact';
import { FileList, StoreContextProvider, SaveIconButton, SimpleFileName } from './store/StoreControls';
import GlyphPicker from './GlyphPicker';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select  from '@mui/material/Select';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
import CardHeader from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import { ThemeProvider } from '@mui/material/styles';
import { NavAppBar, NavDrawer, NavHeader, NavMain } from './Nav';
import { appTheme } from './Theme';
import { ReactComponent as Icon } from './icon.svg';
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';


// // Force an import of this otherwise webpack doesn't think it's referenced
// require("./TextEditor");


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
	selectionPixels: number | null
};

function THRMIcon(props: SvgIconProps) {
	return (
		<SvgIcon component={Icon} {...props} inheritViewBox />
	);
}

function App() {
	let [font, setFont] = useState<number>(0);
	let [cur, setCur] = useState<TEInfo | undefined>();
	let [open, setOpen] = useState<boolean>(true);
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
		if(ref.current !== null) updateCursor({target: ref.current});
	})

	return (
		<StoreContextProvider editor={ref}>
			<ThemeProvider theme={appTheme}>
			<NavAppBar position="fixed">
				<Toolbar>
					<IconButton
						color="inherit"
						aria-label="open drawer"
						onClick={e => setOpen(!open)}
						edge="start"
						// sx={{ ...(open && { display: 'none' }) }}
					>
						<MenuIcon />
					</IconButton>
					<THRMIcon sx={{m: 2, mr: 1}}/>
					<Typography variant="h6" noWrap component="div">
						XIV Macro Maker
					</Typography>

					<Box sx={{flexGrow: 1}}/>		
					<FormControl size="small" color="inverted">
						{/* <InputLabel sx={{color:"inherit", borderColor: "currentcolor"}} id="font-size">Font size</InputLabel> */}
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

				</Toolbar>
			</NavAppBar>
			<NavDrawer variant="persistent" anchor="left" open={open}>

				<Toolbar/>
				<Box sx={{overflow: "auto"}} >
					<FileList/>
				</Box>
			</NavDrawer>
			<NavMain open={open}>
				<NavHeader/>
				<Stack direction="row" spacing={3} justifyContent="center">
					<Card>
						<CardHeader sx={{boxShadow: 1}}>
						<Stack direction="row">
							<SimpleFileName/>
							<SaveIconButton/>
							<SaveIconButton asCopy={true}/>
						</Stack>
						</CardHeader>
						<CardMedia>
							<TextEditor fontsrc={fontSources[font].src} ref={ref} onUpdate={updateCursor} value={"line\n\nline"}/>
						</CardMedia>
					<CardActions sx={{boxShadow: 1}}>
							{cur && <div className="status row">
								Ln {cur.cursorRow}, Col {cur.cursorCol} [{cur.cursorX}, {cur.cursorY}] {selectionText}
							</div>}
						
						
					</CardActions>
					</Card>
					<GlyphPicker editorRef={ref} />
				</Stack>
			</NavMain>
			</ThemeProvider>
		</StoreContextProvider>
		
	);
}

export default App;
