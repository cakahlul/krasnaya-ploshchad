import assert from 'node:assert/strict';
import test from 'node:test';
import { isAdmittedMember, canAccessProject, hasUniqueReportName } from './access-policy';

const member = { email: 'a@amarbank.co.id', joinDate: '2025-01-01', resignDate: null };
test('admission rejects unverified, unrostered, foreign-domain, future, and departed users', () => {
  assert.equal(isAdmittedMember({ email: member.email, email_verified: true }, member, '2026-10-20', 'amarbank.co.id'), true);
  for (const [user, roster] of [
    [{ email: member.email, email_verified: false }, member],
    [{ email: member.email, email_verified: true }, null],
    [{ email: 'a@evil.co', email_verified: true }, { ...member, email: 'a@evil.co' }],
    [{ email: member.email, email_verified: true }, { ...member, resignDate: '2026-10-19' }],
    [{ email: member.email, email_verified: true }, { ...member, joinDate: '2026-10-21' }],
  ] as const) assert.equal(isAdmittedMember(user, roster, '2026-10-20', 'amarbank.co.id'), false);
});

test('project and legacy-name checks fail closed', () => {
  assert.equal(canAccessProject({ isLead: false, teams: ['SLS'] }, 'SLS'), true);
  assert.equal(canAccessProject({ isLead: false, teams: ['SLS'] }, 'OTHER'), false);
  assert.equal(canAccessProject(undefined, 'SLS'), false);
  assert.equal(canAccessProject({ isLead: true }, 'OTHER'), true);
  assert.equal(hasUniqueReportName('A', [{ fullName: 'A' }]), true);
  assert.equal(hasUniqueReportName('A', [{ fullName: 'A' }, { fullName: 'A' }]), false);
});
