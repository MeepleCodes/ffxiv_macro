import { initializeApp } from "firebase/app";
import firebase from "firebase/compat/app";

// Far from perfect but at least we're not committing the keys to github
// (they're still accessible from the packed javascript)
const firebaseConfig = {
    apiKey:             import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:         import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:          import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:  import.meta.env.VITE_FIREBASE_MESSAGE_SENDER_ID,
    appId:              import.meta.env.VITE_FIREBASE_APP_ID
};


// Initialize Firebase
console.log("Initialising Firebase with appId", firebaseConfig.appId);
export const app = initializeApp(firebaseConfig);
// Initialise a v8 compatability mode version for Firebase WebUI to use
export const compatApp = firebase.initializeApp(firebaseConfig);