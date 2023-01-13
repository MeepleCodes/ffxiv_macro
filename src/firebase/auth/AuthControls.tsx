import 'firebaseui/dist/firebaseui.css';
import {auth as uiauth} from 'firebaseui';
import { useEffect, useRef, useState } from 'react';
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { compatApp } from '../Firebase';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import LoginIcon from '@mui/icons-material/Login';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import StyledFirebaseAuth from './StyledFirebaseAuth';

const auth = firebase.auth(compatApp);

const firebaseUiConfig = {
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        // FacebookAuthProvider.PROVIDER_ID,
        // TwitterAuthProvider.PROVIDER_ID,
        // GithubAuthProvider.PROVIDER_ID,
        // EmailAuthProvider.PROVIDER_ID,
        // PhoneAuthProvider.PROVIDER_ID,
        uiauth.AnonymousAuthProvider.PROVIDER_ID        
    ],
    signInFlow: 'popup',
    tosUrl: () => { console.error("TODO: Implement TOS")},
    privacyPolicyUrl: () => { console.error("TODO: Implement TOS")},
}

export default function AuthMenu() {
    const buttonRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState<firebase.User|null>(null);
    const updateUser = (newUser: firebase.User|null) => {
        setUser((currentUser) => {
            if(newUser !== currentUser) {
                console.log("User changed, closing menu");
                setOpen(false);
            }
            return newUser;
        });
    };
    const signOut = () => {
        auth.signOut();
    }
    useEffect(() => {
        const unregisterAuthObserver = auth.onAuthStateChanged(updateUser);
        return () => {
            unregisterAuthObserver();
        }
    }, []);

    return <>
        <IconButton onClick={() => setOpen(!open)} ref={buttonRef}>
            {user === null ? <LoginIcon/> : <AccountCircleIcon/>}
        </IconButton>
        <Popover open={open} onClose={() => setOpen(false)} anchorEl={buttonRef.current} anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}>
            {user === null ? <StyledFirebaseAuth uiConfig={firebaseUiConfig} firebaseAuth={auth}/> : <div>Signed in as {user.displayName} <Button onClick={signOut}>Sign out</Button></div>}
        </Popover>
    </>
}