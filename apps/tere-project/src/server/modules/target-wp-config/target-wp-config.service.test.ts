import assert from 'node:assert/strict';
import { TargetWpConfigError, TargetWpConfigService } from './target-wp-config.service';
import type { TargetWpAuditEntry, TargetWpConfig, TargetWpRates } from './target-wp-config.repository';

const rates: TargetWpRates = {
  junior: 4.5,
  medior: 6,
  senior: 8,
  'individual contributor': 8,
};

const existing: TargetWpConfig = {
  id: '77f8489c-5dd1-4455-8a1c-d5a7cd318dca',
  effective_date: '2026-07-14',
  rates,
};

const repo = {
  fetchAll: async () => [existing],
  getEffectiveRates: async () => rates,
  fetchAuditLog: async () => [],
  createWithAudit: async () => existing,
  deleteWithAudit: async () => existing,
};

async function main() {
  const auditRows: TargetWpAuditEntry[] = Array.from({ length: 21 }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(20 - index).padStart(12, '0')}`,
    entity_id: existing.id,
    action: index % 2 === 0 ? 'create' : 'delete',
    changed_by: 'lead@amarbank.co.id',
    old_value: index % 2 === 0 ? null : existing,
    new_value: index % 2 === 0 ? existing : null,
    changed_at: '2026-07-14T01:02:03.123456Z',
  }));

  let receivedCursor: unknown = 'not-called';
  const auditService = new TargetWpConfigService({
    ...repo,
    fetchAuditLog: async cursor => {
      receivedCursor = cursor;
      return auditRows;
    },
  });
  const firstPage = await auditService.fetchAuditLog(null);
  assert.equal(receivedCursor, null);
  assert.deepEqual(firstPage.items, auditRows.slice(0, 20));
  assert.equal(typeof firstPage.next_cursor, 'string');

  await auditService.fetchAuditLog(firstPage.next_cursor);
  assert.deepEqual(receivedCursor, {
    changed_at: auditRows[19].changed_at,
    id: auditRows[19].id,
  });

  const boundaryPage = await new TargetWpConfigService({
    ...repo,
    fetchAuditLog: async () => auditRows.slice(0, 20),
  }).fetchAuditLog(null);
  assert.equal(boundaryPage.next_cursor, null);

  const cursorJson = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  for (const invalidCursor of [
    '',
    'a'.repeat(513),
    'eyJ2IjoxfQ==',
    '$',
    cursorJson({ v: 2, changed_at: auditRows[0].changed_at, id: auditRows[0].id }),
    cursorJson({ v: 1, changed_at: auditRows[0].changed_at }),
    cursorJson({ v: 1, changed_at: auditRows[0].changed_at, id: auditRows[0].id, extra: true }),
    cursorJson({ v: 1, changed_at: '2026-02-30T01:02:03.123456Z', id: auditRows[0].id }),
    cursorJson({ v: 1, changed_at: '0000-01-01T00:00:00.000000Z', id: auditRows[0].id }),
    cursorJson({ v: 1, changed_at: '2026-07-14T01:02:03.123Z', id: auditRows[0].id }),
    cursorJson({ v: 1, changed_at: auditRows[0].changed_at, id: 'not-a-uuid' }),
  ]) {
    let called = false;
    await assert.rejects(
      new TargetWpConfigService({
        ...repo,
        fetchAuditLog: async () => {
          called = true;
          return [];
        },
      }).fetchAuditLog(invalidCursor),
      (error: unknown) => error instanceof TargetWpConfigError
        && error.status === 400
        && error.code === 'VALIDATION_ERROR'
        && error.message === 'Invalid audit cursor'
        && error.fields?.cursor === 'Invalid cursor',
    );
    assert.equal(called, false);
  }

  let createdBy = '';
  const createService = new TargetWpConfigService({
    ...repo,
    createWithAudit: async (_date, _rates, actor) => {
      createdBy = actor;
      return existing;
    },
  });
  const created = await createService.create('2026-07-14', rates, 'lead@amarbank.co.id');
  assert.equal(created, existing);
  assert.equal(createdBy, 'lead@amarbank.co.id');

  for (const badRates of [
    { ...rates, junior: 0 },
    { ...rates, senior: -1 },
    { ...rates, medior: NaN },
  ]) {
    let calledCreate = false;
    await assert.rejects(
      new TargetWpConfigService({
        ...repo,
        createWithAudit: async () => {
          calledCreate = true;
          return existing;
        },
      }).create('2026-07-14', badRates, 'lead@amarbank.co.id'),
      (error: unknown) => error instanceof TargetWpConfigError
        && error.status === 400
        && error.code === 'VALIDATION_ERROR',
    );
    assert.equal(calledCreate, false);
  }

  let deletedBy = '';
  const deleteService = new TargetWpConfigService({
    ...repo,
    deleteWithAudit: async (_id, actor) => {
      deletedBy = actor;
      return null;
    },
  });
  await deleteService.delete(existing.id, 'lead@amarbank.co.id');
  assert.equal(deletedBy, 'lead@amarbank.co.id');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
