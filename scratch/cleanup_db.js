
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

async function cleanup() {
  const keyPath = path.resolve(process.cwd(), 'fir-project-f09ad-firebase-adminsdk-fbsvc-9b47310a7d.json');
  if (!fs.existsSync(keyPath)) {
    console.error('Service account key not found');
    return;
  }

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com` // Corrected URL
  });

  const db = admin.database();
  const firestore = admin.firestore();

  console.log('Cleaning up RTDB...');
  await db.ref('live_incidents').set(null);
  console.log('RTDB live_incidents cleared.');

  console.log('Cleaning up Firestore...');
  const snapshot = await firestore.collection('incidents').get();
  const batch = firestore.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Firestore incidents cleared (${snapshot.size} docs).`);

  process.exit(0);
}

cleanup().catch(err => {
  console.error(err);
  process.exit(1);
});
