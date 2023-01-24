import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';

import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import InputBase from '@mui/material/InputBase';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Paper from '@mui/material/Paper';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';

import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import ViewListIcon from '@mui/icons-material/ViewList';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';

import SortAlphabeticalAscending from 'mdi-material-ui/SortAlphabeticalAscending';
import SortAlphabeticalDescending from 'mdi-material-ui/SortAlphabeticalDescending';
import SortClockAscendingOutline from 'mdi-material-ui/SortClockAscendingOutline';
import SortClockDescendingOutline from 'mdi-material-ui/SortClockDescendingOutline';
import SortVariantOff from 'mdi-material-ui/SortVariantOff';


import format from 'date-fns/format'

import { FunctionComponent, useContext, useEffect, useState } from 'react';
import { StoreContext } from './StoreControls';
import { Unsubscribe } from 'firebase/firestore';
import { auth } from '../auth/FirebaseAuth';
import { MacroDoc, Sort, SortKeys, Store } from './Firestore';

import {  styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';

const Preview = styled(({className}: {className?: string, mask: string, textColor?: string, small?: boolean}) => <div className={className}><div></div></div>)( ({theme, small, textColor, mask}) => {
    const size = small ? 10 : 20;
    return {
        width: '100%',
        '& div': {
            width: '100%',
            background: textColor || theme.palette.primary.main,
            maskComposite: 'source-in',
            maskRepeat: 'no-repeat',
            ...(small ? {
                aspectRatio: '1',
                maskImage: `url(${mask}), ` + (["top", "left"].map(edge => `linear-gradient(to ${edge}, transparent, black ${size}px)`)).join(", "),
            } : {
                aspectRatio: '3/2',
                maskImage: `url(${mask}), linear-gradient(to bottom, black calc(100% - 80px), transparent calc(100% - 20px), transparent), linear-gradient(to right, black calc(100% - 20px), transparent)`,
            })
        }
    }
});

interface Mode {
    name: string;
    icon: JSX.Element;
}

type ViewModeProps = {macros: MacroDoc[], onLoad?: (macro: MacroDoc) => void, onDelete?: (macro: MacroDoc) => void};
interface ViewMode extends Mode {
    ListComponent: FunctionComponent<ViewModeProps>;
};
interface SortMode extends Mode {
    sortKey?: Sort;
};
const sortModes: SortMode[] = [
    {name: "Unsorted", icon: <SortVariantOff/>, sortKey: undefined},
    {name: "Name", icon: <SortAlphabeticalAscending/>, sortKey: {key: SortKeys.name, ascending: true}},
    {name: "Name (reversed)", icon: <SortAlphabeticalDescending/>, sortKey: {key: SortKeys.name, ascending: false}},
    {name: "Newest first", icon: <SortClockDescendingOutline/>, sortKey: {key: SortKeys.updated, ascending: false}},
    {name: "Oldest first", icon: <SortClockAscendingOutline/>, sortKey: {key: SortKeys.updated, ascending: true}},
];
const defaultSortMode = sortModes[3];
function updated(macro: MacroDoc) {
    // return macro.updated ? formatDistanceToNow(macro.updated.toDate(), {includeSeconds: true, addSuffix: true}) : "No modified date/time"
    return macro.updated ? 
        format(macro.updated.toDate(), "PPpp") :
        "No modified date/time"
}

function PreviewList({macros, onLoad, onDelete}: ViewModeProps) {
    return <ImageList cols={1} sx={{marginBottom: 0, marginTop: 0}}>
        {macros.map((macro) => <ImageListItem key={macro.id} onClick={() => onLoad?.(macro)}>
        <Preview className="MuiImageListItem-img" textColor="black" mask={`data:image/png;base64,${macro.thumbnail.toBase64()}`}/>
        <ImageListItemBar
            title={macro.name}
            subtitle={updated(macro)}
            actionIcon={
                <IconButton
                    aria-label="Delete"
                    onClick={(e) => {e.stopPropagation(); onDelete?.(macro)}}>
                    <DeleteIcon/>
                </IconButton>
            }
        />
    </ImageListItem>)}
    </ImageList>;
}
function ListList({macros, onLoad, onDelete}: ViewModeProps) {
    return <List dense>
        {macros.map(macro => <ListItem title={macro.name} disableGutters disablePadding key={macro.id} secondaryAction={<IconButton
                    aria-label="Delete"
                    onClick={(e) => {e.stopPropagation(); onDelete?.(macro)}}>
                    <DeleteIcon/>
                </IconButton>
        }>
            <ListItemButton onClick={() => onLoad?.(macro)} >
            <ListItemAvatar>
                <Avatar variant="square" textColor="white" component={Preview} mask={`data:image/png;base64,${macro.thumbnail.toBase64()}`} small/>
            </ListItemAvatar>
            <ListItemText primary={macro.name} secondary={updated(macro)} primaryTypographyProps={{noWrap: true}}/>
            </ListItemButton>
        </ListItem>)}
    </List>
}
const viewModes: ViewMode[] = [
    {
        name: "Previews",
        icon: <ViewAgendaIcon/>,
        ListComponent:  PreviewList
    },
    {
        name: "List",
        icon: <ViewListIcon/>,
        ListComponent: ListList
    }
];
interface ModeMenuProps<T extends Mode> extends IconButtonProps {modes: T[], mode: T, setMode: (newValue: T) => void};
function ModeMenu<T extends Mode>({modes, mode, setMode, ...props}: ModeMenuProps<T>) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    return <div>
        <IconButton size="small" onClick={handleClick} {...props}>
            {mode.icon}
        </IconButton>
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}>
                {modes.map(m => <MenuItem onClick={() => {handleClose(); setMode(m);}} selected={m === mode} key={m.name}>
                    {m.icon} {m.name}
                </MenuItem>)}
            </Menu>
        </div>
}

function FileList(props: any){
    const [fileList, setFileList] = useState<MacroDoc[]>([]);
    const {editor, setLoading, setFilename, setFileid} = useContext(StoreContext);
    const [viewMode, setViewMode] = useState<ViewMode>(viewModes[0]);
    const [sortMode, setSortMode] = useState<SortMode>(defaultSortMode);
    const [deleteMacro, setDeleteMacro] = useState<MacroDoc|null>(null);
    const [filterText, setFilterText] = useState("");
    useEffect(() => {
        let lastWatcher: Unsubscribe | null = null;
        const unregister = auth.onAuthStateChanged(() => {
            if(lastWatcher !== null) lastWatcher();
            lastWatcher = Store.watchAll(setFileList, sortMode.sortKey, filterText !== "" ? filterText : undefined);
        });
        return () => {
            unregister();
            if(lastWatcher) lastWatcher();
        }
    }, [sortMode, filterText]);
    const load = async function(id?: string) {
        if(id === undefined) return;
        console.log("Loading started");
        setLoading(true);
        const doc = await Store.load(id);
        if(doc === null) {
            console.error("Failed to load macro ID", id);
        } else {
            setFileid(doc.id);
            setFilename(doc.name);
            editor.current?.setAttribute("value", doc.text);
        }
        setLoading(false);
    };
    const markDeleted = async function(id?: string) {
        if(id === undefined) return;
        setLoading(true);
        await Store.markDeleted(id);
        setLoading(false);
    }
    return <Stack sx={{height: "100%"}} spacing={0} {...props}>
        <Paper sx={{p: 0.5, m:0.5, display: 'flex', alignItems: 'center'}}>
            <InputBase 
                placeholder="Filter..." 
                sx={{ml: 1, flex: 1}} value={filterText} onChange={(e) => setFilterText(e.target.value)}
                startAdornment={<InputAdornment position="start" disablePointerEvents><SearchIcon/></InputAdornment>}
                endAdornment={filterText === "" ? undefined : <InputAdornment position="end"><IconButton onClick={() => setFilterText("")}><ClearIcon/></IconButton></InputAdornment>}
            />
            <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
            <ModeMenu color="primary" modes={sortModes} mode={sortMode} setMode={setSortMode} title="Sort order"/>
            <ModeMenu color="primary" modes={viewModes} mode={viewMode} setMode={setViewMode} title="Display as..."/>
            <Dialog
                open={deleteMacro !== null}
                onClose={() => setDeleteMacro(null)}
            >
                <DialogContent>
                <DialogContentText>
                    Delete macro <b>{deleteMacro?.name}</b>?
                </DialogContentText>
                </DialogContent>
                <DialogActions>
                <Button onClick={() => setDeleteMacro(null)}>Cancel</Button>
                <Button onClick={() => {markDeleted(deleteMacro?.id); setDeleteMacro(null);}} autoFocus>
                    Delete
                </Button>
                </DialogActions>
            </Dialog>            
        </Paper>
            <viewMode.ListComponent onLoad={(macro) => load(macro.id)} onDelete={setDeleteMacro} macros={fileList} />
        </Stack>
}
const StyledFileList = styled(FileList)(({theme}) => ({
    '& .MuiImageListItem-root': {
        cursor: 'pointer',
        '& div.masking': {
            maskImage: "linear-gradient(to bottom, black calc(100% - 80px), transparent calc(100% - 20px), transparent), linear-gradient(to right, black calc(100% - 20px), transparent)",
            maskComposite: "source-in",       
        },
    },
    '& .MuiImageListItemBar-titleWrap': {
        padding: theme.spacing(1, 1.5)
    },
    // '& .MuiIconButton-root': {
    //     color: theme.palette.primary.contrastText,
    // },
}));

export { StyledFileList };