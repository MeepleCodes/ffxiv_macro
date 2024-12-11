import { getAuth, User } from "firebase/auth";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { app, compatApp } from '../Firebase';
import React from "react";

export const auth = getAuth(app);
export const compatAuth = firebase.auth(compatApp);

compatAuth.onAuthStateChanged((user) => {
    if(user === null) {
        console.log("Logged out, auto-logging anonymously");
        void compatAuth.signInAnonymously();
    }
});

/**
 * React hook for getting the current user, or null if we aren't logged in.
 * @returns The current user
 */
export function useCurrentUser() {
    const [user, setUser] = React.useState<User|null>(null);
    React.useEffect(() => {
        const unregister = auth.onAuthStateChanged(
            (user: User|null) => {
                setUser(user);
            }
        );
        return () => {
            unregister();
        } 
    }, [setUser]);
    return user;
}