import assert from 'node:assert/strict';
import { BoardsService } from './boards.service';
import type { BoardEntity } from '@shared/types/board.types';

async function main() {
  let reportingGroup: BoardEntity['reportingGroup'] = 'Loan';
  let calls = 0;
  const service = new BoardsService({
    findAll: async () => {
      calls++;
      return [{
        id: 'board-1',
        boardId: 1,
        name: 'Loan Board',
        shortName: 'LOAN',
        reportingGroup,
        reportingBoardLeadEmail: 'loan-lead@amarbank.co.id',
      }];
    },
  });

  assert.equal((await service.findAll())[0].reportingGroup, 'Loan');
  reportingGroup = 'User';
  assert.equal((await service.findAll())[0].reportingGroup, 'Loan');
  assert.equal(calls, 1, 'second read uses cached board configuration');

  service.invalidateCache();
  const refreshed = await service.findAll();
  assert.equal(refreshed[0].reportingGroup, 'User');
  assert.equal(refreshed[0].reportingBoardLeadEmail, 'loan-lead@amarbank.co.id');
  assert.equal(calls, 2, 'invalidation reloads repository configuration');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
