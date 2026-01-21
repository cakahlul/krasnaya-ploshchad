export type UserRole = 'Lead' | 'Member';

export interface UserAccess {
  email: string;
  role: UserRole;
}
