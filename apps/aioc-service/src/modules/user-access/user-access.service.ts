import { Injectable, NotFoundException } from '@nestjs/common';
import admin from '../../firebase/firebase-admin';
import { UserAccessDto } from './dto/user-access.dto';

@Injectable()
export class UserAccessService {
  private readonly firestore = admin.firestore();

  async getUserAccess(email: string): Promise<UserAccessDto> {
    try {
      const snapshot = await this.firestore
        .collection('user-access')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        // Return default role of 'Member' for users not in the database
        return {
          email: email,
          role: 'Member',
        };
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      const fs = require('fs');
      const path = require('path');
      try {
        fs.appendFileSync(
          path.resolve(process.cwd(), 'debug_access.log'),
          `[${new Date().toISOString()}] Email: ${email}, Role: ${data.role}\n`
        );
      } catch (e) {
        console.error('Failed to write log', e);
      }

      return {
        email: data.email || email,
        role: data.role as 'Lead' | 'Member',
      };
    } catch (error) {
      // Return default role for any errors
      return {
        email: email,
        role: 'Member',
      };
    }
  }
}
