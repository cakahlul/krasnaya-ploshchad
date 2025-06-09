/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-require-imports */
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

let credentials: admin.ServiceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    // For Vercel or production
    try {
      const serviceAccountPath = path.join(
        os.tmpdir(),
        'serviceAccountKey.json',
      );
      const decodedCredentials = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        'base64',
      ).toString();
      fs.writeFileSync(serviceAccountPath, decodedCredentials);
      credentials = JSON.parse(decodedCredentials);
      console.log('✅ Firebase initialized with environment variable');
    } catch (error) {
      console.error('Error parsing Firebase credentials:', error);
      throw new Error('Invalid Firebase credentials format');
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Alternative: Direct JSON string in environment variable
    try {
      credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('✅ Firebase initialized with direct JSON');
    } catch (error) {
      console.error('Error parsing Firebase credentials:', error);
      throw new Error('Invalid Firebase credentials format');
    }
  } else {
    // For local development
    const serviceAccountPath = path.resolve(
      __dirname,
      './../../tere-project-5billion-firebase-admin.json',
    );
    if (fs.existsSync(serviceAccountPath)) {
      credentials = require(serviceAccountPath);
      console.log('✅ Firebase initialized with local file');
    } else {
      throw new Error('Firebase credentials not found');
    }
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  throw error;
}

export default admin;
