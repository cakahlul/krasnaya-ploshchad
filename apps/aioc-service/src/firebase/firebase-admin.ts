/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-require-imports */
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

let credentials: admin.ServiceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  // For Railway or production
  const serviceAccountPath = path.join(os.tmpdir(), 'serviceAccountKey.json');
  fs.writeFileSync(
    serviceAccountPath,
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64'),
  );
  credentials = require(serviceAccountPath);
  console.log('✅ Firebase initialized');
} else {
  // ✅ For LOCAL development using actual JSON file
  credentials = require(
    path.resolve(
      __dirname,
      './../../tere-project-5billion-firebase-admin.json',
    ),
  );
}

admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

export default admin;
