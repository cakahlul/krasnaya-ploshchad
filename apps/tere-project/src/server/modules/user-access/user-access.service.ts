import { db } from '@server/lib/db';
import { userAccess } from '@server/db/schema';
import { eq } from 'drizzle-orm';

class UserAccessService {
  async getUserRole(email: string): Promise<'Lead' | 'Member'> {
    try {
      const [row] = await db
        .select({ role: userAccess.role })
        .from(userAccess)
        .where(eq(userAccess.email, email));
      return row?.role ?? 'Member';
    } catch {
      return 'Member';
    }
  }
}

export const userAccessService = new UserAccessService();
