import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import type { Holiday } from './holidays.repository';

if (process.env.ALLOW_DB_CONTRACT_TEST !== '1') {
  throw new Error('Set ALLOW_DB_CONTRACT_TEST=1 to run this isolated-database contract check');
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

type AuditRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changed_by: string;
  old_value: Holiday | null;
  new_value: Holiday | null;
  changed_at: Date;
};

const actor = `holiday-contract-${randomUUID()}@example.invalid`;
const sql = postgres(databaseUrl, { prepare: false, max: 1 });
const fixtureDates = new Set<string>();
const holidayIds = new Set<string>();
const auditIds = new Set<string>();

async function removeKnownFixtures(): Promise<void> {
  for (const id of holidayIds) await sql`DELETE FROM holidays WHERE id = ${id}`;
  for (const id of auditIds) await sql`DELETE FROM config_audit_log WHERE id = ${id}`;
  holidayIds.clear();
  auditIds.clear();
  fixtureDates.clear();
}

async function unusedFutureDate(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const offset = Number.parseInt(randomUUID().slice(0, 8), 16) % 36_500;
    const date = new Date(Date.UTC(2200, 0, 1 + offset)).toISOString().slice(0, 10);
    const [usage] = await sql<[{ count: number }]>`
      SELECT (
        (SELECT count(*) FROM holidays WHERE date = ${date})
        +
        (SELECT count(*) FROM config_audit_log
          WHERE entity_type = 'holiday'
            AND (old_value->>'holiday_date' = ${date} OR new_value->>'holiday_date' = ${date}))
      )::int AS count
    `;
    if (usage.count === 0) {
      fixtureDates.add(date);
      return date;
    }
  }
  throw new Error('Could not allocate an unused far-future fixture date');
}

async function unusedPastDate(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const offset = Number.parseInt(randomUUID().slice(0, 8), 16) % 36_500;
    const date = new Date(Date.UTC(1900, 0, 1 + offset)).toISOString().slice(0, 10);
    const [usage] = await sql<[{ count: number }]>`
      SELECT (
        (SELECT count(*) FROM holidays WHERE date = ${date})
        +
        (SELECT count(*) FROM config_audit_log
          WHERE entity_type = 'holiday'
            AND (old_value->>'holiday_date' = ${date} OR new_value->>'holiday_date' = ${date}))
      )::int AS count
    `;
    if (usage.count === 0) {
      fixtureDates.add(date);
      return date;
    }
  }
  throw new Error('Could not allocate an unused far-past fixture date');
}

async function holidayCountForDate(date: string): Promise<number> {
  const [row] = await sql<[{ count: number }]>`
    SELECT count(*)::int AS count FROM holidays WHERE date = ${date}
  `;
  return row.count;
}

async function auditsFor(entityId: string): Promise<AuditRow[]> {
  const rows = await sql<AuditRow[]>`
    SELECT id, entity_type, entity_id, action, changed_by,
           old_value, new_value, changed_at
    FROM config_audit_log
    WHERE entity_id = ${entityId} AND entity_type = 'holiday'
    ORDER BY changed_at, id
  `;
  rows.forEach(row => auditIds.add(row.id));
  return rows;
}

async function main() {
  const [{ HolidaysRepository }, { db }] = await Promise.all([
    import('./holidays.repository'),
    import('@server/lib/db'),
  ]);
  const repo = new HolidaysRepository();

  try {
    // --- TC-HOL-DB-001: createWithAudit happy path -------------------------
    const date = await unusedFutureDate();
    const created = await repo.createWithAudit(date, 'Contract Fixture Day', actor);
    holidayIds.add(created.id!);
    assert.equal(created.holiday_date, date);
    assert.equal(created.holiday_name, 'Contract Fixture Day');
    assert.equal(created.is_national_holiday, true);

    let events = await auditsFor(created.id!);
    assert.equal(events.length, 1);
    assert.deepEqual(events[0], {
      id: events[0].id,
      entity_type: 'holiday',
      entity_id: created.id,
      action: 'create',
      changed_by: actor,
      old_value: null,
      new_value: created,
      changed_at: events[0].changed_at,
    }, 'create audit row must be an exact snapshot of {id,holiday_date,holiday_name,is_national_holiday}');
    assert.deepEqual(
      Object.keys(events[0].new_value as object).sort(),
      ['holiday_date', 'holiday_name', 'id', 'is_national_holiday'],
      'new_value must not carry extra or missing keys',
    );

    // --- TC-HOL-DB-002/019: createWithAudit atomic rollback on audit fail --
    const rollbackDate = await unusedFutureDate();
    await assert.rejects(
      repo.createWithAudit(rollbackDate, 'Should Not Persist', ' '),
      (error: unknown) => typeof error === 'object' && error !== null
        && 'code' in error && error.code === '23514',
    );
    assert.equal(
      await holidayCountForDate(rollbackDate),
      0,
      'audit insert failure must roll back the holiday row (scanned by date, not by id)',
    );
    const leakedAudits = await sql<{ id: string }[]>`
      SELECT id FROM config_audit_log
      WHERE entity_type = 'holiday'
        AND (old_value->>'holiday_date' = ${rollbackDate} OR new_value->>'holiday_date' = ${rollbackDate})
    `;
    leakedAudits.forEach(row => auditIds.add(row.id));
    assert.equal(leakedAudits.length, 0, 'failed transaction must not retain an audit event');

    // --- TC-HOL-DB-004: no unique constraint on date -> no dedup ------------
    const dupDate = await unusedFutureDate();
    const [dupA, dupB] = await Promise.all([
      repo.createWithAudit(dupDate, 'Dup Holiday A', actor),
      repo.createWithAudit(dupDate, 'Dup Holiday B', actor),
    ]);
    holidayIds.add(dupA.id!);
    holidayIds.add(dupB.id!);
    assert.notEqual(dupA.id, dupB.id, 'holidays.date has no unique constraint: both concurrent creates must succeed');
    assert.equal(await holidayCountForDate(dupDate), 2, 'both same-date holidays must be persisted (no-dedup)');
    assert.equal((await auditsFor(dupA.id!)).length, 1);
    assert.equal((await auditsFor(dupB.id!)).length, 1);

    // --- TC-HOL-DB-005: createManyWithAudit happy path ----------------------
    const bulkDates = [await unusedFutureDate(), await unusedFutureDate(), await unusedFutureDate()];
    const bulkItems = bulkDates.map((d, i) => ({ date: d, name: `Bulk Holiday ${i}` }));
    const bulkCreated = await repo.createManyWithAudit(bulkItems, actor);
    bulkCreated.forEach(h => holidayIds.add(h.id!));
    assert.equal(bulkCreated.length, 3);
    for (let i = 0; i < 3; i += 1) {
      assert.equal(await holidayCountForDate(bulkDates[i]), 1);
      const auditRows = await auditsFor(bulkCreated[i].id!);
      assert.equal(auditRows.length, 1);
      assert.equal(auditRows[0].action, 'create');
      assert.deepEqual(auditRows[0].new_value, bulkCreated[i]);
      assert.equal(auditRows[0].changed_by, actor);
    }

    // --- TC-HOL-DB-006/020: createManyWithAudit all-or-nothing --------------
    const bulkFailDates = [await unusedFutureDate(), await unusedFutureDate(), await unusedFutureDate()];
    const bulkFailItems = bulkFailDates.map((d, i) => ({ date: d, name: `Bulk Fail ${i}` }));
    const [{ count: totalBefore }] = await sql<[{ count: number }]>`SELECT count(*)::int AS count FROM holidays`;
    await assert.rejects(
      repo.createManyWithAudit(bulkFailItems, ' '),
      (error: unknown) => typeof error === 'object' && error !== null
        && 'code' in error && error.code === '23514',
    );
    const [{ count: totalAfter }] = await sql<[{ count: number }]>`SELECT count(*)::int AS count FROM holidays`;
    assert.equal(totalAfter, totalBefore, 'a mid-batch failure must not leave any partial commit (total row count unchanged)');
    for (const d of bulkFailDates) {
      assert.equal(await holidayCountForDate(d), 0, `no row for ${d} may survive a failed bulk transaction`);
    }

    // --- TC-HOL-DB-009: deleteFutureWithAudit happy path --------------------
    const futureDeleteDate = await unusedFutureDate();
    const toDelete = await repo.createWithAudit(futureDeleteDate, 'To Be Deleted', actor);
    holidayIds.add(toDelete.id!);
    const deleted = await repo.deleteFutureWithAudit(toDelete.id!, actor);
    assert.deepEqual(deleted, toDelete);
    assert.equal(await holidayCountForDate(futureDeleteDate), 0);
    events = await auditsFor(toDelete.id!);
    assert.equal(events.length, 2);
    const deleteEvents = events.filter(event => event.action === 'delete');
    assert.equal(deleteEvents.length, 1);
    assert.deepEqual(deleteEvents[0], {
      id: deleteEvents[0].id,
      entity_type: 'holiday',
      entity_id: toDelete.id,
      action: 'delete',
      changed_by: actor,
      old_value: toDelete,
      new_value: null,
      changed_at: deleteEvents[0].changed_at,
    });

    // --- TC-HOL-DB-010: deleteFutureWithAudit guard, non-future is no-op ----
    const pastDate = await unusedPastDate();
    const notFuture = await repo.createWithAudit(pastDate, 'Not Future', actor);
    holidayIds.add(notFuture.id!);
    const [{ count: rowCountBefore }] = await sql<[{ count: number }]>`
      SELECT count(*)::int AS count FROM holidays WHERE id = ${notFuture.id}
    `;
    const guardResult = await repo.deleteFutureWithAudit(notFuture.id!, actor);
    assert.equal(guardResult, null, 'non-future holiday must be a no-op (null), never deleted');
    const [{ count: rowCountAfter }] = await sql<[{ count: number }]>`
      SELECT count(*)::int AS count FROM holidays WHERE id = ${notFuture.id}
    `;
    assert.equal(rowCountAfter, rowCountBefore, 'row must still exist after guarded no-op');
    assert.equal(rowCountAfter, 1);
    const noopEvents = await auditsFor(notFuture.id!);
    assert.deepEqual(noopEvents.map(e => e.action), ['create'], 'guarded no-op must not add a delete audit event');

    // --- TC-HOL-DB-011: deleteFutureWithAudit with unknown id ---------------
    assert.equal(await repo.deleteFutureWithAudit(randomUUID(), actor), null);

    // --- TC-HOL-DB-012: deleteFutureWithAudit atomic rollback ---------------
    const deleteRollbackDate = await unusedFutureDate();
    const deleteRollbackHoliday = await repo.createWithAudit(deleteRollbackDate, 'Delete Rollback', actor);
    holidayIds.add(deleteRollbackHoliday.id!);
    await assert.rejects(
      repo.deleteFutureWithAudit(deleteRollbackHoliday.id!, ' '),
      (error: unknown) => typeof error === 'object' && error !== null
        && 'code' in error && error.code === '23514',
    );
    assert.equal(await holidayCountForDate(deleteRollbackDate), 1, 'audit failure must roll back the holiday deletion');
    const retainedAudits = await auditsFor(deleteRollbackHoliday.id!);
    assert.deepEqual(
      retainedAudits.map(event => event.action),
      ['create'],
      'failed delete must not retain a delete audit event',
    );

    await removeKnownFixtures();

    // --- TC-HOL-DB-013/014: entity_type constraint --------------------------
    const validEntityId = randomUUID();
    await sql`
      INSERT INTO config_audit_log
        (id, entity_type, entity_id, action, changed_by, old_value, new_value)
      VALUES
        (${randomUUID()}, 'holiday', ${validEntityId}, 'create', ${actor}, null,
         ${sql.json({ id: validEntityId, holiday_date: '2399-01-01', holiday_name: 'x', is_national_holiday: true })})
    `;
    const insertedValid = await sql<{ id: string }[]>`
      SELECT id FROM config_audit_log WHERE entity_id = ${validEntityId}
    `;
    insertedValid.forEach(row => auditIds.add(row.id));
    assert.equal(insertedValid.length, 1, 'entity_type=holiday must be accepted by config_audit_log_entity_supported');

    const decoyId = randomUUID();
    await assert.rejects(
      sql`
        INSERT INTO config_audit_log
          (id, entity_type, entity_id, action, changed_by, old_value, new_value)
        VALUES
          (${decoyId}, 'decoy_entity', ${randomUUID()}, 'create', ${actor}, null, ${sql.json({ id: randomUUID() })})
      `,
      (error: unknown) => typeof error === 'object' && error !== null
        && 'constraint_name' in error && error.constraint_name === 'config_audit_log_entity_supported',
    );
    const rejectedDecoy = await sql<{ id: string }[]>`SELECT id FROM config_audit_log WHERE id = ${decoyId}`;
    assert.equal(rejectedDecoy.length, 0, 'rejected entity_type must leave no row');

    // --- TC-HOL-DB-015: action constraint ------------------------------------
    const badActionId = randomUUID();
    await assert.rejects(
      sql`
        INSERT INTO config_audit_log
          (id, entity_type, entity_id, action, changed_by, old_value, new_value)
        VALUES
          (${badActionId}, 'holiday', ${randomUUID()}, 'update', ${actor}, null, ${sql.json({ id: randomUUID() })})
      `,
      (error: unknown) => typeof error === 'object' && error !== null
        && 'constraint_name' in error && error.constraint_name === 'config_audit_log_action_supported',
    );
    assert.equal(
      (await sql<{ id: string }[]>`SELECT id FROM config_audit_log WHERE id = ${badActionId}`).length,
      0,
    );

    // --- TC-HOL-DB-016/017: snapshot shape constraint ------------------------
    const shapeCreateBadId = randomUUID();
    await assert.rejects(
      sql`
        INSERT INTO config_audit_log
          (id, entity_type, entity_id, action, changed_by, old_value, new_value)
        VALUES
          (${shapeCreateBadId}, 'holiday', ${randomUUID()}, 'create', ${actor},
           ${sql.json({ id: randomUUID() })}, ${sql.json({ id: randomUUID() })})
      `,
      (error: unknown) => typeof error === 'object' && error !== null
        && 'constraint_name' in error && error.constraint_name === 'config_audit_log_snapshot_shape',
    );

    const shapeDeleteBadId = randomUUID();
    await assert.rejects(
      sql`
        INSERT INTO config_audit_log
          (id, entity_type, entity_id, action, changed_by, old_value, new_value)
        VALUES
          (${shapeDeleteBadId}, 'holiday', ${randomUUID()}, 'delete', ${actor}, null, null)
      `,
      (error: unknown) => typeof error === 'object' && error !== null
        && 'constraint_name' in error && error.constraint_name === 'config_audit_log_snapshot_shape',
    );
    assert.equal(
      (await sql<{ id: string }[]>`
        SELECT id FROM config_audit_log WHERE id IN (${shapeCreateBadId}, ${shapeDeleteBadId})
      `).length,
      0,
    );

    // --- TC-HOL-DB-018: changed_by non-blank constraint ----------------------
    const blankActorId = randomUUID();
    await assert.rejects(
      sql`
        INSERT INTO config_audit_log
          (id, entity_type, entity_id, action, changed_by, old_value, new_value)
        VALUES
          (${blankActorId}, 'holiday', ${randomUUID()}, 'create', '   ', null, ${sql.json({ id: randomUUID() })})
      `,
      (error: unknown) => typeof error === 'object' && error !== null
        && 'constraint_name' in error && error.constraint_name === 'config_audit_log_actor_nonblank',
    );
    assert.equal(
      (await sql<{ id: string }[]>`SELECT id FROM config_audit_log WHERE id = ${blankActorId}`).length,
      0,
    );

    console.log('Holiday atomic audit + DB constraint contract: PASS');
  } finally {
    for (const date of fixtureDates) {
      const holidayRows = await sql<{ id: string }[]>`SELECT id FROM holidays WHERE date = ${date}`;
      holidayRows.forEach(row => holidayIds.add(row.id));
      const audits = await sql<{ id: string }[]>`
        SELECT id FROM config_audit_log
        WHERE entity_type = 'holiday'
          AND (old_value->>'holiday_date' = ${date} OR new_value->>'holiday_date' = ${date})
      `;
      audits.forEach(row => auditIds.add(row.id));
    }
    await removeKnownFixtures();
    await sql.end();
    await db.$client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
