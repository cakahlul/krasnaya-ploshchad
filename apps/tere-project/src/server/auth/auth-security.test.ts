import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { auth } from '@server/lib/firebase-admin';
import { membersService } from '@server/modules/members/members.service';
import { membersRepository } from '@server/modules/members/members.repository';
import { apiKeysService } from '@server/modules/api-keys/api-keys.service';
import { talentLeaveRepository } from '@server/modules/talent-leave/talent-leave.repository';
import { bugMonitoringService } from '@server/modules/bug-monitoring/bug-monitoring.service';
import { holidaysService } from '@server/modules/holidays/holidays.service';
import { withAuth } from './with-auth';
import { withAuthOrApiKey } from './with-auth-or-api-key';
import { GET as readMember, PUT as updateMember, DELETE as deleteMember } from '@src/app/api/members/[id]/route';
import { GET as listMembers, POST as createMember } from '@src/app/api/members/route';
import { GET as sprintReport } from '@src/app/api/report/route';
import { GET as openReport } from '@src/app/api/report/all/route';
import { GET as listBoards } from '@src/app/api/boards/route';
import { GET as listProjects } from '@src/app/api/project/route';
import { GET as sprints } from '@src/app/api/project/sprint/route';
import { GET as batchSprints } from '@src/app/api/project/sprint/batch/route';
import { GET as leaveList } from '@src/app/api/talent-leave/route';
import { GET as talents } from '@src/app/api/talent-leave/talents/route';
import { boardsService } from '@server/modules/boards/boards.service';
import { sprintService } from '@server/modules/sprint/sprint.service';
import { talentLeaveService } from '@server/modules/talent-leave/talent-leave.service';
import { GET as bugs } from '@src/app/api/bug-monitoring/summary/route';
import { GET as leave, PUT as updateLeave, DELETE as deleteLeave } from '@src/app/api/talent-leave/[id]/route';
import { GET as stories } from '@src/app/api/report/stories/route';
import { GET as epics } from '@src/app/api/report/epics/route';
import { POST as holiday } from '@src/app/api/holidays/route';
import { POST as seed } from '@src/app/api/members/seed/route';
import { GET as productivity } from '@src/app/api/report/productivity-summary/route';

const email = 'member@amarbank.co.id';
const request = (path: string, method = 'GET', body?: unknown, apiKey = false) => new Request(`http://localhost/api/${path}`, {
  method, headers: { ...(apiKey ? { 'x-api-key': 'tere_test' } : { Authorization: 'Bearer test' }), 'Content-Type': 'application/json' },
  ...(body ? { body: JSON.stringify(body) } : {}),
});
const context = { params: Promise.resolve({ id: 'record' }) };

test('real route wrappers reject escalation, cross-user reads, project bypass, and invalid principals', async () => {
  process.env.NEXT_PUBLIC_ALLOWED_DOMAIN = 'amarbank.co.id';
  process.env.DEVELOPER_EMAILS = 'developer@amarbank.co.id';
  let member = { id: 'member', email, fullName: 'Member', jiraId: 'jira-member', teams: ['SLS'], isLead: false, joinDate: '2025-01-01', resignDate: null as string | null };
  let user = { email, email_verified: true };
  let firebaseUser = { email, emailVerified: true, disabled: false, tokensValidAfterTime: '2020-01-01T00:00:00Z' };
  let roster = [member];
  let admissionMember: typeof member | null;
  let readOwner = 'other@amarbank.co.id';
  let mutations = 0;
  mock.method(auth, 'verifyIdToken', async (_token: string, checkRevoked: boolean) => { assert.equal(checkRevoked, true); return user; });
  mock.method(auth, 'getUserByEmail', async () => firebaseUser);
  mock.method(membersService, 'findByEmail', async () => admissionMember === null ? null : member);
  mock.method(membersRepository, 'findAll', async () => roster);
  mock.method(membersService, 'findByJiraId', async () => ({ email: readOwner }));
  mock.method(membersService, 'findAll', async () => [member, { ...member, id: 'other', email: 'other@amarbank.co.id', fullName: 'Other' }, { ...member, id: 'departed', fullName: 'Departed', resignDate: '2025-01-01' }, { ...member, id: 'other-team', fullName: 'Other Team', teams: ['DS'] }]);
  mock.method(membersService, 'findOne', async () => ({ ...member, id: 'other' }));
  mock.method(boardsService, 'findAll', async () => [{ boardId: 1, shortName: 'SLS' }, { boardId: 2, shortName: 'DS' }, { boardId: 3, shortName: 'SLS', isBugMonitoring: true }]);
  mock.method(sprintService, 'fetchAllProject', async () => [{ key: 'SLS' }, { key: 'DS' }]);
  mock.method(sprintService, 'fetchAllSprint', async (boardId: number) => [{ id: boardId, name: `sprint-${boardId}` }]);
  mock.method(talentLeaveService, 'findAllTalents', async () => [{ id: 'jira-member' }, { id: 'other-jira' }]);
  mock.method(membersService, 'update', async () => { mutations++; return member; });
  mock.method(membersService, 'remove', async () => { mutations++; });
  mock.method(membersService, 'create', async () => { mutations++; return member; });
  mock.method(apiKeysService, 'validateKey', async () => ({ createdBy: email, createdAt: new Date('2026-01-01') }));
  mock.method(talentLeaveService, 'findAll', async () => [{ id: 'mine', memberId: 'jira-member' }, { id: 'theirs', memberId: 'other-jira' }]);
  mock.method(talentLeaveRepository, 'findById', async () => ({ id: 'record', memberId: 'other-jira', name: 'Other', team: 'DS', leaveDate: [], createdAt: new Date(), updatedAt: new Date() }));
  mock.method(bugMonitoringService, 'getBugSummary', async () => ({ ok: true }));
  mock.method(holidaysService, 'createHoliday', async () => { mutations++; return { ok: true }; });
  try {
    assert.deepEqual((await (await listMembers(request('members'))).json()).map((item: { id: string }) => item.id), ['member']);
    assert.equal((await readMember(request('members/other'), { params: Promise.resolve({ id: 'other' }) })).status, 403);
    assert.deepEqual((await (await talents(request('talent-leave/talents'))).json()).map((item: { id: string }) => item.id), ['jira-member', 'other-jira']);
    assert.deepEqual((await (await listProjects(request('project'))).json()).map((item: { key: string }) => item.key), ['SLS']);
    for (const apiKey of [false, true]) {
      assert.deepEqual((await (await listBoards(request('boards', 'GET', undefined, apiKey))).json()).map((item: { boardId: number }) => item.boardId), [1]);
      assert.equal((await sprints(request('project/sprint?boardId=2', 'GET', undefined, apiKey))).status, 403);
      assert.equal((await sprintReport(request('report?project=DS&sprint=1', 'GET', undefined, apiKey))).status, 403);
      assert.equal((await openReport(request('report/all?project=DS', 'GET', undefined, apiKey))).status, 403);
      assert.equal((await batchSprints(request('project/sprint/batch?boardIds=1,2', 'GET', undefined, apiKey))).status, 403);
      assert.equal((await sprints(request('project/sprint?boardId=1', 'GET', undefined, apiKey))).status, 200);
    }
    for (const response of [
      await updateMember(request('members/member', 'PUT', { isLead: true }), context),
      await deleteMember(request('members/other', 'DELETE'), context),
      await createMember(request('members', 'POST', { email, isLead: true })),
      await holiday(request('holidays', 'POST', { date: '2027-01-01', name: 'X' }), context),
      await seed(request('members/seed', 'POST')),
      await bugs(request('bug-monitoring/summary?boardId=1')),
      await bugs(request('bug-monitoring/summary?boardId=1', 'GET', undefined, true)),
      await updateLeave(request('talent-leave/record', 'PUT', { leaveDate: [] }), context),
      await deleteLeave(request('talent-leave/record', 'DELETE'), context),
      await epics(request('report/epics?project=DS&sprint=1', 'GET', undefined, true)),
      await stories(request('report/stories?project=DS&sprint=1')),
    ]) assert.equal(response.status, 403);
    assert.equal(mutations, 0);
    assert.equal((await epics(request('report/epics?project=SLS&sprint=1%20OR%20project=DS'))).status, 400);
    assert.equal((await stories(request('report/stories?project=SLS&startDate=bad&endDate=2026-01-01'))).status, 400);

    assert.equal((await leave(request('talent-leave/record'), context)).status, 200);
    for (const apiKey of [false, true]) {
      assert.deepEqual((await (await leaveList(request('talent-leave', 'GET', undefined, apiKey))).json()).map((item: { id: string }) => item.id), ['mine', 'theirs']);
    }
    readOwner = email;
    assert.equal((await leave(request('talent-leave/record'), context)).status, 200);
    member = { ...member, isLead: true };
    assert.equal((await (await listMembers(request('members'))).json()).length, 4);
    assert.deepEqual((await (await listMembers(request('members?scope=dashboard'))).json()).map((item: { id: string }) => item.id), ['member', 'other']);
    assert.equal((await (await listBoards(request('boards', 'GET', undefined, true))).json()).length, 3);
    assert.equal((await (await listProjects(request('project'))).json()).length, 2);
    assert.equal((await readMember(request('members/other'), { params: Promise.resolve({ id: 'other' }) })).status, 200);
    assert.equal((await updateMember(request('members/member', 'PUT', { fullName: 'New' }), context)).status, 200);
    assert.equal((await bugs(request('bug-monitoring/summary?boardId=1', 'GET', undefined, true))).status, 200);
    assert.equal((await leave(request('talent-leave/record'), context)).status, 200);
    assert.equal(mutations, 1);

    const allowed = withAuth(async () => Response.json({ ok: true }));
    user = { ...user, email_verified: false };
    assert.equal((await allowed(request('test'))).status, 403);
    user = { email, email_verified: true };
    admissionMember = null;
    assert.equal((await allowed(request('test'))).status, 403);
    admissionMember = member;
    member = { ...member, resignDate: '2025-12-31' };
    assert.equal((await allowed(request('test'))).status, 403);
    member = { ...member, resignDate: null, isLead: false };
    const keyHandler = withAuthOrApiKey(async () => Response.json({ ok: true }));
    firebaseUser = { ...firebaseUser, disabled: true };
    assert.equal((await keyHandler(request('test', 'GET', undefined, true))).status, 401);
    firebaseUser = { ...firebaseUser, disabled: false, tokensValidAfterTime: '2026-02-01T00:00:00Z' };
    assert.equal((await keyHandler(request('test', 'GET', undefined, true))).status, 401);
    firebaseUser = { ...firebaseUser, tokensValidAfterTime: '2020-01-01T00:00:00Z' };
    roster = [member, { ...member, id: 'other', email: 'other@amarbank.co.id' }];
    assert.equal((await productivity(request('report/productivity-summary?month=1&year=2026'))).status, 403);
    assert.equal((await productivity(request('report/productivity-summary?month=1&year=2026', 'GET', undefined, true))).status, 403);
  } finally { mock.restoreAll(); }
});
