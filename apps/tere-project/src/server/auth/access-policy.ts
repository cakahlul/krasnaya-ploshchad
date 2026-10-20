import { isMemberActiveDuring } from '@shared/utils/member-lifecycle.util';

export function isAdmittedMember(
  user: { email?: string; email_verified?: boolean },
  member: { email: string; joinDate?: string | null; resignDate?: string | null } | null,
  today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
  domain = process.env.NEXT_PUBLIC_ALLOWED_DOMAIN || 'amarbank.co.id',
): boolean {
  return Boolean(user.email && user.email_verified && member
    && user.email.toLowerCase() === member.email.toLowerCase()
    && user.email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)
    && isMemberActiveDuring(member, { startDate: today, endDate: today }));
}

export function canAccessProject(caller: { isLead?: boolean; teams?: readonly string[] } | undefined, project: string): boolean {
  return Boolean(caller && (caller.isLead || caller.teams?.some(team => team.toUpperCase() === project.toUpperCase())));
}

export function hasUniqueReportName(name: string | undefined, members: readonly { fullName: string }[]): boolean {
  return Boolean(name && members.filter(member => member.fullName.trim().toLowerCase() === name.trim().toLowerCase()).length === 1);
}

export function canAccessBoard(
  caller: { isLead?: boolean; teams?: readonly string[] } | undefined,
  board: { shortName: string; isBugMonitoring?: boolean },
): boolean {
  return canAccessProject(caller, board.shortName) && Boolean(caller?.isLead || !board.isBugMonitoring);
}
