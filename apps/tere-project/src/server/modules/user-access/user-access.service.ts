import { membersService } from '@server/modules/members/members.service';
import { isAdmittedMember } from '@server/auth/access-policy';

class UserAccessService {
  async getUserRole(email: string): Promise<'Lead' | 'Member'> {
    const member = await membersService.findByEmail(email);
    return member?.isLead && isAdmittedMember({ email, email_verified: true }, member) ? 'Lead' : 'Member';
  }
}

export const userAccessService = new UserAccessService();
