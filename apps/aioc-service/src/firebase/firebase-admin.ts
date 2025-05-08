import * as admin from 'firebase-admin';
import * as fs from 'fs';

// Write the base64-decoded service account JSON to disk
const serviceAccountPath = '/tmp/serviceAccountKey.json';
const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (!base64) {
  throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_BASE64 env variable');
}

fs.writeFileSync(serviceAccountPath, Buffer.from(base64, 'base64'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

export default admin;
