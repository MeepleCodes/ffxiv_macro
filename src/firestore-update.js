const admin = require("firebase-admin");
const credentials = require("../firebaseCredentials.json");
async function addDeletedField() {
    admin.initializeApp({
        credential: admin.credential.cert(credentials)
    });
    const db = admin.firestore();
    const q = await db.collection("macros").get();
    const batch = db.batch();
    q.forEach((doc) => {
        if(doc.exists && doc.get("deleted") === undefined) {
            console.log(`Updated /db/macros/${doc.id}`);
            batch.update(doc.ref, {"deleted": false});
        }
    })

    await batch.commit();
}
addDeletedField().then(() => console.log("Done"));