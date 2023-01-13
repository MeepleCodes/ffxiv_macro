import { initializeApp } from "firebase/app";
import firebase from "firebase/compat/app";

// Far from perfect but at least we're not committing the keys to github
// (they're still accessible from the packed javascript)
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGE_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};


// Initialize Firebase
console.log("Initialising Firebase with appId", firebaseConfig.appId);
export const app = initializeApp(firebaseConfig);
// Initialise a v8 compatability mode version for Firebase WebUI to use
export const compatApp = firebase.initializeApp(firebaseConfig);