/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-require-imports */
import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class FirebaseAdmin {
  private readonly logger = new Logger(FirebaseAdmin.name);
  private app: admin.app.App;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    const startTime = Date.now();
    this.logger.log(`[${startTime}] Initializing Firebase Admin...`);

    try {
      let serviceAccount: admin.ServiceAccount;

      if (process.env.NODE_ENV === 'production') {
        this.logger.log(
          `[${Date.now()}] Running in production mode, using environment variables`,
        );

        // Try base64 first
        if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
          this.logger.log(
            `[${Date.now()}] Found FIREBASE_SERVICE_ACCOUNT_BASE64, attempting to decode`,
          );
          try {
            const decoded = Buffer.from(
              process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
              'base64',
            ).toString();
            serviceAccount = JSON.parse(decoded);
            this.logger.log(
              `[${Date.now()}] Successfully decoded and parsed base64 credentials`,
            );
          } catch (error) {
            this.logger.error(
              `[${Date.now()}] Failed to decode base64 credentials:`,
              error,
            );
            throw error;
          }
        }
        // Try direct JSON string
        else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          this.logger.log(
            `[${Date.now()}] Found FIREBASE_SERVICE_ACCOUNT, attempting to parse`,
          );
          try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            this.logger.log(
              `[${Date.now()}] Successfully parsed JSON credentials`,
            );
          } catch (error) {
            this.logger.error(
              `[${Date.now()}] Failed to parse JSON credentials:`,
              error,
            );
            throw error;
          }
        } else {
          throw new Error(
            'Firebase credentials not found in environment variables',
          );
        }
      } else {
        this.logger.log(
          `[${Date.now()}] Running in development mode, using local file`,
        );
        const serviceAccountPath = path.join(
          process.cwd(),
          'tere-project-5billion-firebase-admin.json',
        );

        if (!fs.existsSync(serviceAccountPath)) {
          throw new Error(
            `Firebase service account file not found at ${serviceAccountPath}`,
          );
        }

        try {
          serviceAccount = JSON.parse(
            fs.readFileSync(serviceAccountPath, 'utf8'),
          );
          this.logger.log(
            `[${Date.now()}] Successfully loaded local credentials file`,
          );
        } catch (error) {
          this.logger.error(
            `[${Date.now()}] Failed to read or parse local credentials file:`,
            error,
          );
          throw error;
        }
      }

      this.logger.log(
        `[${Date.now()}] Initializing Firebase Admin SDK with credentials`,
      );
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      const endTime = Date.now();
      this.logger.log(
        `[${endTime}] Firebase Admin initialized successfully in ${endTime - startTime}ms`,
      );
    } catch (error) {
      const endTime = Date.now();
      this.logger.error(
        `[${endTime}] Failed to initialize Firebase Admin after ${endTime - startTime}ms:`,
        error,
      );
      throw error;
    }
  }

  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    const startTime = Date.now();
    this.logger.log(`[${startTime}] Verifying Firebase token...`);

    try {
      const decodedToken = await this.app.auth().verifyIdToken(token);
      const endTime = Date.now();
      this.logger.log(
        `[${endTime}] Token verified successfully in ${endTime - startTime}ms`,
      );
      return decodedToken;
    } catch (error) {
      const endTime = Date.now();
      this.logger.error(
        `[${endTime}] Token verification failed after ${endTime - startTime}ms:`,
        error,
      );
      throw error;
    }
  }
}
