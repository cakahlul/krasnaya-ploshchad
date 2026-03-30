import { firestore } from '@server/lib/firebase-admin';

class UserAccessService {
  async getUserRole(email: string): Promise<'Lead' | 'Member'> {
    try {
      const snapshot = await firestore
        .collection('user-access')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) return 'Member';

      const role = snapshot.docs[0].data().role as 'Lead' | 'Member';
      return role ?? 'Member';
    } catch {
      return 'Member';
    }
  }
}

export const userAccessService = new UserAccessService();
