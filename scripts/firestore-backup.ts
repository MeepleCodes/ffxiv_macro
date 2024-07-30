/**
 * Create a backup of firestore databases, just in case
 */

import { applicationDefault, initializeApp } from "firebase-admin/app";
import { Firestore } from "firebase-admin/firestore";
import { promises } from "fs";
import path from "path";

console.log("Starting");
const outpath = "backups/";

// Initialize Firestore admin and get a reference to the service
/*const adminApp = */ initializeApp({credential: applicationDefault()});
const db = new Firestore();

async function backupCollection(db: Firestore, collectionName: string, basePath: string) {
  const coll = db.collection(collectionName);
  const docs = await coll.get();
  Promise.allSettled(
    docs.docs.map(
      doc => 
        promises.writeFile(
          path.resolve(basePath, collectionName, `${doc.id}.json`),
          JSON.stringify(doc.data()),
          {
            flag: "w"
          }
        )
    )
  ).then(results => {
    if(results.every(v => v.status === "fulfilled")) {
      console.log("Saved %d records to %s", docs.docs.length, path.resolve(basePath, collectionName));
    } else {
      results.forEach((v, i) => {
        if(v.status === "rejected") {
          console.error("Failed to save %s: %s", path.resolve(basePath, collectionName, `${docs.docs[i].id}.json`), v.reason);
        }
      })
    }
  })
  
}

console.log("Backing up macros");
await backupCollection(db, "macros", outpath);
