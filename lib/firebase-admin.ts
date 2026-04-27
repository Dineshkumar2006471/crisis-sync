import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

type ServiceAccountLike = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function buildDatabaseUrl(projectId?: string) {
  const explicitUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (explicitUrl) {
    return explicitUrl;
  }

  if (projectId) {
    return `https://${projectId}-default-rtdb.firebaseio.com`;
  }

  return undefined;
}

function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccountLike;
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.project_id,
      ...(buildDatabaseUrl(serviceAccount.project_id) ? { databaseURL: buildDatabaseUrl(serviceAccount.project_id) } : {}),
    });
  }

  const keyPath = path.resolve(process.cwd(), 'fir-project-f09ad-firebase-adminsdk-fbsvc-9b47310a7d.json');
  if (fs.existsSync(keyPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8')) as ServiceAccountLike;
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.project_id,
      ...(buildDatabaseUrl(serviceAccount.project_id) ? { databaseURL: buildDatabaseUrl(serviceAccount.project_id) } : {}),
    });
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    ...(projectId ? { projectId } : {}),
    ...(buildDatabaseUrl(projectId) ? { databaseURL: buildDatabaseUrl(projectId) } : {}),
  });
}

export function getAdminDb() {
  return getAdminApp().database();
}

export function getAdminFirestore() {
  return getAdminApp().firestore();
}

export function getAdminAuth() {
  return getAdminApp().auth();
}

export default getAdminApp;
