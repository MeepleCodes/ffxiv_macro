import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import ViewListIcon from '@mui/icons-material/ViewList';

import SortAlphabeticalAscending from 'mdi-material-ui/SortAlphabeticalAscending';
import SortAlphabeticalDescending from 'mdi-material-ui/SortAlphabeticalDescending';
import SortClockAscendingOutline from 'mdi-material-ui/SortClockAscendingOutline';
import SortClockDescendingOutline from 'mdi-material-ui/SortClockDescendingOutline';
import SortVariantOff from 'mdi-material-ui/SortVariantOff';



import { Component, EventHandler, FunctionComponent, PropsWithChildren, ReactEventHandler, useContext, useEffect, useState } from 'react';
import { StoreContext } from './StoreControls';
import { Unsubscribe } from 'firebase/firestore';
import { auth } from '../auth/FirebaseAuth';
import { MacroDoc, Sort, SortKeys, Store } from './Firestore';

import {  styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';

const MaskedImage = styled("div")<{mask: string}>(({theme, mask}) => ({
    background: theme.palette.primary.main,
    aspectRatio: '3/2',
    maskComposite: 'source-in',
    maskImage: `url(${mask})`,
    maskRepeat: 'no-repeat',
}));


const NO_SORT = "UNSORTED";
type SortOrder = Sort | "UNSORTED";

function renderSort(sort: SortOrder) {
    let name, icon, key;
    if(sort === NO_SORT) {
        name = "Unsorted";
        key = "unsorted";
        icon = <SortVariantOff/>
    } else {
        if(sort.key === SortKeys.name) {
            if(sort.ascending) {
                name = "Name";
                icon = <SortAlphabeticalAscending/>
            } else {
                name = "Name (reversed)";
                icon = <SortAlphabeticalDescending/>
            }
        } else {
            if(sort.ascending) {
                name = "Oldest first";
                icon = <SortClockAscendingOutline/>
            } else {
                name = "Newest first";
                icon = <SortClockDescendingOutline/>;
            }
        }
        key = `${name}-${sort.ascending}`;
    }
    return {name, icon, key}
}
const asc = [true, false];
const keys = [SortKeys.updated, SortKeys.name];
const sortOrders: SortOrder[] = (keys.flatMap(k => asc.map(a => ({key: k, ascending: a}))) as SortOrder[]).concat([NO_SORT] as SortOrder[]);
const defaultSortOrder = sortOrders[1]; // Latest first
interface Mode {
    name: string;
    icon: JSX.Element;
}

type ViewModeProps = {macros: MacroDoc[], onLoad?: (macro: MacroDoc) => void, onDelete?: (macro: MacroDoc) => void};
interface ViewMode extends Mode {
    ListComponent: FunctionComponent<ViewModeProps>;
};
const viewModes: ViewMode[] = [
    {
        name: "Previews",
        icon: <ViewAgendaIcon/>,
        ListComponent:  ({macros, onLoad, onDelete}) => <ImageList cols={1} sx={{marginBottom: 0}}>
             {macros.map((macro) => <ImageListItem onClick={() => onLoad?.(macro)}>
                <div className="masking">
                    <MaskedImage className="MuiImageListItem-img" mask={`data:image/png;base64,${macro.thumbnail.toBase64()}`}/>
                </div>
                <ImageListItemBar
                    title={macro.name}
                    subtitle={macro.updated ? macro.updated.toDate().toString() : "No modified date/time"}
                    actionIcon={
                        <IconButton
                            aria-label="Delete"
                            onClick={() => onDelete?.(macro)}>
                            <DeleteIcon/>
                        </IconButton>
                    }
                />
            </ImageListItem>)}
        </ImageList>
    },
    {
        name: "List",
        icon: <ViewListIcon/>,
        ListComponent: ({macros, onLoad, onDelete}) => <></>
    }
];
interface ModeMenuProps<T extends Mode> {modes: T[], mode: T, setMode: (newValue: T) => void};
function ModeMenu<T extends Mode>({modes, mode, setMode}: ModeMenuProps<T>) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    return <div>
        <IconButton onClick={handleClick}>
            {mode.icon}
        </IconButton>
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}>
                {modes.map(m => <MenuItem onClick={() => setMode(m)}>
                    {m.icon} {m.name}
                </MenuItem>)}
            </Menu>
        </div>
}

function FileList(props: any){
    const [fileList, setFileList] = useState<MacroDoc[]>([]);
    const {editor, setLoading, setFilename, setFileid} = useContext(StoreContext);
    const [viewMode, setViewMode] = useState<ViewMode>(viewModes[0]);
    const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);
    useEffect(() => {
        let lastWatcher: Unsubscribe | null = null;
        const unregister = auth.onAuthStateChanged((user) => {
            if(lastWatcher !== null) lastWatcher();
            lastWatcher = Store.watchAll(setFileList, sortOrder === NO_SORT ? undefined : sortOrder);
        });
        return () => {
            unregister();
            if(lastWatcher) lastWatcher();
        }
    }, [sortOrder]);
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
    }
    // const refreshFiles = async function() {
    //     setFileList(await Store.loadAll());
    // }   
    // TODO: Sort-by dropdown 
    // TODO: Floating 'reload' button
    // [x] TODO: Foreground colour picked from theme not hard-coded
    // [X] TODO: gradient overlay on images
    // TODO: momentjs for last-update timestamp formatting
    return <Stack sx={{height: "100%"}} {...props}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{paddingLeft: 1}}>
            {/* <ToggleButtonGroup
                size="small"
                value={sortOrder}
                exclusive
                onChange={(ev, value) => setSortOrder(value || NO_SORT)}
                >
                    {sortOrders.map(o => {
                        const r = renderSort(o);
                        return  <ToggleButton
                            value={o}
                            key={r.key}
                            aria-label={r.name}
                            >
                                {r.icon}
                            </ToggleButton>
                    }
                    )}
            </ToggleButtonGroup> */}
            <Typography variant="button">Sort</Typography>
            <FormControl size="small" variant="standard">
                <Select
                    value={sortOrder}
                    renderValue={o => renderSort(o).icon}
                    onChange={(ev) => setSortOrder(ev.target.value as SortOrder)}
                    >
                    {sortOrders.map(o => {
                        const r = renderSort(o);
                        return <MenuItem value={o as any} key={r.key}>
                            {r.icon} {r.name}
                        </MenuItem>
                    })}
                </Select>
            </FormControl>
        </Stack>
            <viewMode.ListComponent onLoad={(macro) => load(macro.id)} macros={fileList} />
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
    '& .MuiIconButton-root': {
        color: theme.palette.primary.contrastText,
    },
}));

export { StyledFileList };