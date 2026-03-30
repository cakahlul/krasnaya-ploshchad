import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Global singleton survives Next.js hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __firebaseAdminApp: App | undefined;
}

function initAdmin(): App {
  if (global.__firebaseAdminApp) return global.__firebaseAdminApp;
  if (getApps().length) {
    global.__firebaseAdminApp = getApps()[0];
    return global.__firebaseAdminApp;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      'base64',
    ).toString('utf-8');
    const serviceAccount = JSON.parse(decoded);
    global.__firebaseAdminApp = initializeApp({ credential: cert(serviceAccount) });
  } else {
    // Dev: relies on GOOGLE_APPLICATION_CREDENTIALS env var or ADC
    global.__firebaseAdminApp = initializeApp();
  }

  return global.__firebaseAdminApp;
}

const app = initAdmin();

export const firebaseAdmin = app;
export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);

// Re-export session cookie helpers used by existing auth routes
export { auth as adminAuth };
