// lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

type ServiceAccountLike = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  try {
    let serviceAccount: ServiceAccountLike;
    
    // 1. Try Environment Variable (Production/Vercel)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccountLike;
    } 
    // 2. Try Absolute Path (Local Dev)
    else {
      const keyPath = path.resolve(process.cwd(), 'fir-project-f09ad-firebase-adminsdk-fbsvc-9b47310a7d.json');
      if (fs.existsSync(keyPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8')) as ServiceAccountLike;
      } else {
        throw new Error(`Firebase Service Account JSON not found at ${keyPath}. Please ensure the file is in the root directory.`);
      }
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
    });
  } catch (error) {
    console.error('CRITICAL: Firebase Admin Initialization Failed:', error);
    // Return a dummy app or let it throw so the route catches it
    throw error;
  }
}

// Ensure it's initialized
let app: admin.app.App | null = null;
try {
   app = getAdminApp();
} catch {
   app = null;
}

export const adminDb = app ? app.database() : null;
export const adminFirestore = app ? app.firestore() : null;
export const adminAuth = app ? app.auth() : null;

export default app;
