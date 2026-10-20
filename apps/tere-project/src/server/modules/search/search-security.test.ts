import assert from 'node:assert/strict';
import test from 'node:test';
import { SearchRepository } from './search.repository';
import { jiraClient } from '@server/lib/jira.client';
import { boardsService } from '@server/modules/boards/boards.service';

const repo = new SearchRepository();
test('ticket detail denies unauthorized projects and malformed keys before Jira access', async () => {
  const original = jiraClient.get;
  jiraClient.get = (async () => { throw new Error('must not call Jira'); }) as typeof jiraClient.get;
  try {
    for (const key of ['SLS-1', 'SLS-1/../../myself', 'SLS-1?fields=*']) {
      assert.equal(await repo.getTicketDetail(key, ['DS']), null);
    }
  } finally { jiraClient.get = original; }
});

test('search intersects configured projects with caller scope before querying Jira', async () => {
  const originalGet = jiraClient.get;
  const originalBoards = boardsService.findAll;
  let jql = '';
  boardsService.findAll = async () => [{ shortName: 'SLS' }, { shortName: 'DS' }] as never;
  jiraClient.get = (async (_url: string, options: { params: { jql: string } }) => {
    jql = options.params.jql;
    return { data: { issues: [] } };
  }) as typeof jiraClient.get;
  try {
    await repo.searchTickets('hello', 6, 0, undefined, ['SLS']);
    assert.match(jql, /project IN \(SLS\)/);
    assert.doesNotMatch(jql, /DS|ABB/);
    jql = '';
    await repo.searchTickets('hello', 6, 0, undefined, []);
    assert.equal(jql, '');
  } finally { jiraClient.get = originalGet; boardsService.findAll = originalBoards; }
});
