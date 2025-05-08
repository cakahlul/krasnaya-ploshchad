import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.applicationDefault(), // or use cert() with service account
});

export default admin;
