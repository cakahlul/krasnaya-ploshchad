import assert from 'node:assert/strict';
import test from 'node:test';
import type { ArchiveParseResult } from './archive-import.types';
import { parseBlue2026Archive } from './blue-2026-parser';

test('Blue parser satisfies the canonical archive import contract', () => {
  const result: ArchiveParseResult = parseBlue2026Archive([{
    sprintId: 'Sprint 42', sprintName: 'June sprint',
    sprintStartDate: '2026-06-01', sprintEndDate: '2026-06-14',
    developerIdentity: 'ada@example.com', developerName: 'Ada', spTotal: 0, spCompleted: 0,
  }]);

  assert.equal(result.sourceFormat, 'blue-2026');
  assert.equal(result.records[0]?.spTotal, 0);
  assert.deepEqual(result.rejections, []);
});
