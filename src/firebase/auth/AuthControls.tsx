import 'firebaseui/dist/firebaseui.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import LoginIcon from '@mui/icons-material/Login';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { compatAuth } from './FirebaseAuth';


const firebaseUiConfig: firebaseui.auth.Config = {
    autoUpgradeAnonymousUsers: true,
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID        
    ],
    callbacks: {
        signInFailure: function(error) {
            // For merge conflicts, the error.code will be
            // 'firebaseui/anonymous-upgrade-merge-conflict'.
            if (error.code !== 'firebaseui/anonymous-upgrade-merge-conflict') {
                return Promise.resolve();
            }
            // The credential the user tried to sign in with.
            var cred = error.credential;
            console.log("Attempting to merge", firebase.auth().currentUser,"with", cred);
            return firebase.auth().signInWithCredential(cred).then((user) => {
                console.log("Now signed in as", user);
            });
        }
    },
    signInFlow: 'popup',
    tosUrl: () => { console.error("TODO: Implement TOS")},
    privacyPolicyUrl: () => { console.error("TODO: Implement TOS")},
}

export default function AuthMenu() {
    const buttonRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState<firebase.User|null>(null);
    const showLogin = user === null || user.isAnonymous;
    const signOut = () => {
        compatAuth.signOut();
    }
    const firebaseUIRef = useCallback((node: Element|null) => {
        console.log("Ref changed, is now", node);
        const firebaseUiWidget = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(compatAuth);
        firebaseUiWidget.reset();
        if(node) firebaseUiWidget.start(node, firebaseUiConfig);
    }, []);
    useEffect(() => {
        const updateUser = (newUser: firebase.User|null) => {
            setUser((currentUser) => {
                if(newUser !== currentUser) {
                    console.log("User changed, closing menu");
                    setOpen(false);
                }
                return newUser;
            });
        };
        const unregisterAuthObserver = compatAuth.onAuthStateChanged(updateUser);
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
            {showLogin ? <div ref={firebaseUIRef}/> : <div>Signed in as {user.displayName} <Button onClick={signOut}>Sign out</Button></div>}
        </Popover>
    </>
}