import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;

if (!getApps().length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      'base64',
    ).toString('utf-8');
    const serviceAccount = JSON.parse(decoded);
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    adminApp = initializeApp();
  }
} else {
  adminApp = getApps()[0];
}

export const adminAuth: Auth = getAuth(adminApp);

