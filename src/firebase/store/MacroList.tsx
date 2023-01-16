import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { useContext, useEffect, useState } from 'react';
import { StoreContext } from './StoreControls';
import { Unsubscribe } from 'firebase/firestore';
import { auth } from '../auth/FirebaseAuth';
import { MacroDoc, Store } from './Firestore';

import {  styled } from '@mui/material/styles';

const MaskedImage = styled("div")<{mask: string}>(({theme, mask}) => ({
    background: theme.palette.primary.main,
    aspectRatio: '3/2',
    maskComposite: 'source-in',
    maskImage: `url(${mask})`,
    maskRepeat: 'no-repeat',
}));

function FileList(props: any){
    let [fileList, setFileList] = useState<MacroDoc[]>([]);
    let {editor, setLoading, setFilename, setFileid} = useContext(StoreContext);
    useEffect(() => {
        let lastWatcher: Unsubscribe | null = null;
        const unregister = auth.onAuthStateChanged((user) => {
            if(lastWatcher !== null) lastWatcher();
            lastWatcher = Store.watchAll(setFileList);
        });
        return () => {
            unregister();
            if(lastWatcher) lastWatcher();
        }
    }, []);
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
    // TODO: Floating 'reload' button
    // TODO: Foreground colour picked from theme not hard-coded
    // TODO: gradient overlay on images
    return <ImageList cols={1} {...props}>
            {fileList.map((macro) => (
                <ImageListItem key={macro.id} onClick={() => load(macro.id)}>
                    <div className="masking">
                        <MaskedImage className="MuiImageListItem-img" mask={`data:image/png;base64,${macro.thumbnail.toBase64()}`}/>
                    </div>
                    <ImageListItemBar
                        title={macro.name}
                        subtitle="Last modified: whenever"
                        actionIcon={
                            <IconButton
                                aria-label="Delete"
                                sx={{color: 'white'}}
                                onClick={() => console.log("TODO: Implement me")}>
                                <DeleteIcon/>
                            </IconButton>
                        }
                    />
                </ImageListItem>

            ))}
        </ImageList>
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
    }
}));

export { StyledFileList };