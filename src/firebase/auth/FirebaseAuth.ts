import { getAuth } from "firebase/auth";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { app, compatApp } from '../Firebase';

export const auth = getAuth(app);
export const compatAuth = firebase.auth(compatApp);

compatAuth.onAuthStateChanged((user) => {
    if(user === null) {
        console.log("Logged out, auto-logging anonymously");
        compatAuth.signInAnonymously();
    }
});