import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import type { WpWeightConfig, WpWeights } from './wp-weight-config.repository';

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
  old_value: WpWeightConfig | null;
  new_value: WpWeightConfig | null;
  changed_at: Date;
};

const weights: WpWeights = {
  'Very Low': 1.25,
  Low: 2.5,
  Medium: 5,
  High: 10,
};
const actor = `wp-weight-contract-${randomUUID()}@example.invalid`;
const sql = postgres(databaseUrl, { prepare: false, max: 1 });
const fixtureDates = new Set<string>();
const configIds = new Set<string>();
const auditIds = new Set<string>();

type AuditApiRow = Omit<AuditRow, 'entity_type' | 'changed_at'> & { changed_at: string };

function sortAuditRows(rows: AuditApiRow[]): AuditApiRow[] {
  return [...rows].sort((left, right) =>
    right.changed_at.localeCompare(left.changed_at) || right.id.localeCompare(left.id),
  );
}

async function insertAuditFixtures(
  count: number,
  anchor: string,
  firstOffset = 1,
): Promise<AuditApiRow[]> {
  const rows: AuditApiRow[] = [];
  for (let index = 0; index < count; index += 1) {
    const id = randomUUID();
    const entityId = randomUUID();
    const offset = index < 2 ? firstOffset : firstOffset + index - 1;
    const snapshot: WpWeightConfig = {
      id: entityId,
      effective_date: '2399-01-01',
      weights,
    };
    const [inserted] = await sql<[{ changed_at: string }]>`
      INSERT INTO config_audit_log
        (id, entity_type, entity_id, action, changed_by, old_value, new_value, changed_at)
      VALUES
        (${id}, 'wp_weight_config', ${entityId}, 'create', ${actor}, null,
         ${sql.json(snapshot)}, ${anchor}::timestamptz - ${offset} * interval '1 microsecond')
      RETURNING to_char(changed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS changed_at
    `;
    auditIds.add(id);
    rows.push({
      id,
      entity_id: entityId,
      action: 'create',
      changed_by: actor,
      old_value: null,
      new_value: snapshot,
      changed_at: inserted.changed_at,
    });
  }
  return sortAuditRows(rows);
}

async function removeKnownFixtures(): Promise<void> {
  for (const id of configIds) await sql`DELETE FROM wp_weight_config WHERE id = ${id}`;
  for (const id of auditIds) await sql`DELETE FROM config_audit_log WHERE id = ${id}`;
  configIds.clear();
  auditIds.clear();
  fixtureDates.clear();
}

async function unusedFutureDate(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const offset = Number.parseInt(randomUUID().slice(0, 8), 16) % 36_500;
    const date = new Date(Date.UTC(2200, 0, 1 + offset)).toISOString().slice(0, 10);
    const [usage] = await sql<[{ count: number }]>`
      SELECT (
        (SELECT count(*) FROM wp_weight_config WHERE effective_date = ${date})
        +
        (SELECT count(*) FROM config_audit_log
          WHERE old_value->>'effective_date' = ${date}
             OR new_value->>'effective_date' = ${date})
      )::int AS count
    `;
    if (usage.count === 0) {
      fixtureDates.add(date);
      return date;
    }
  }
  throw new Error('Could not allocate an unused far-future fixture date');
}

async function auditsFor(entityId: string): Promise<AuditRow[]> {
  const rows = await sql<AuditRow[]>`
    SELECT id, entity_type, entity_id, action, changed_by,
           old_value, new_value, changed_at
    FROM config_audit_log
    WHERE entity_id = ${entityId}
    ORDER BY changed_at, id
  `;
  rows.forEach(row => auditIds.add(row.id));
  return rows;
}

async function main() {
  const [
    { WpWeightConfigRepository },
    { WpWeightConfigError, WpWeightConfigService },
    { db },
  ] = await Promise.all([
    import('./wp-weight-config.repository'),
    import('./wp-weight-config.service'),
    import('@server/lib/db'),
  ]);
  const repo = new WpWeightConfigRepository();
  const service = new WpWeightConfigService(repo, () => '2199-12-31');

  try {
    const date = await unusedFutureDate();
    const [left, right] = await Promise.all([
      service.create(date, weights, actor),
      service.create(date, weights, actor),
    ]);
    assert.equal([left, right].filter(result => result.created).length, 1);
    assert.equal(left.config.id, right.config.id);
    configIds.add(left.config.id);

    const expected = left.config;
    let events = await auditsFor(expected.id);
    assert.equal(events.length, 1);
    assert.deepEqual(events[0], {
      id: events[0].id,
      entity_type: 'wp_weight_config',
      entity_id: expected.id,
      action: 'create',
      changed_by: actor,
      old_value: null,
      new_value: expected,
      changed_at: events[0].changed_at,
    });
    assert(!Number.isNaN(new Date(events[0].changed_at).getTime()));

    const replay = await service.create(date, weights, actor);
    assert.equal(replay.created, false);
    assert.equal(replay.config.id, expected.id);
    assert.equal((await auditsFor(expected.id)).length, 1);

    const deletes = await Promise.allSettled([
      service.delete(expected.id, actor),
      service.delete(expected.id, actor),
    ]);
    assert.equal(deletes.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(deletes.filter(result => result.status === 'rejected').length, 1);
    const rejectedDelete = deletes.find(result => result.status === 'rejected');
    assert(
      rejectedDelete?.reason instanceof WpWeightConfigError
        && rejectedDelete.reason.code === 'CONFIG_NOT_FOUND',
    );

    events = await auditsFor(expected.id);
    assert.equal(events.length, 2);
    const deleteEvents = events.filter(event => event.action === 'delete');
    assert.equal(deleteEvents.length, 1);
    assert.deepEqual(deleteEvents[0], {
      id: deleteEvents[0].id,
      entity_type: 'wp_weight_config',
      entity_id: expected.id,
      action: 'delete',
      changed_by: actor,
      old_value: expected,
      new_value: null,
      changed_at: deleteEvents[0].changed_at,
    });

    const rollbackDate = await unusedFutureDate();
    await assert.rejects(
      repo.createWithAudit(rollbackDate, weights, ' '),
      (error: unknown) => typeof error === 'object' && error !== null
        && 'code' in error && error.code === '23514',
    );
    const leakedConfigs = await sql<{ id: string }[]>`
      SELECT id FROM wp_weight_config WHERE effective_date = ${rollbackDate}
    `;
    leakedConfigs.forEach(row => configIds.add(row.id));
    assert.equal(leakedConfigs.length, 0, 'audit failure must roll back config creation');
    const leakedAudits = await sql<{ id: string }[]>`
      SELECT id FROM config_audit_log
      WHERE old_value->>'effective_date' = ${rollbackDate}
         OR new_value->>'effective_date' = ${rollbackDate}
    `;
    leakedAudits.forEach(row => auditIds.add(row.id));
    assert.equal(leakedAudits.length, 0, 'failed transaction must not retain an audit event');

    const deleteRollbackDate = await unusedFutureDate();
    const deleteRollbackConfig = await repo.createWithAudit(
      deleteRollbackDate,
      weights,
      actor,
    );
    configIds.add(deleteRollbackConfig.id);
    await assert.rejects(
      repo.deleteFutureWithAudit(deleteRollbackConfig.id, ' '),
      (error: unknown) => typeof error === 'object' && error !== null
        && 'code' in error && error.code === '23514',
    );
    const retainedConfigs = await sql<{ id: string }[]>`
      SELECT id FROM wp_weight_config WHERE id = ${deleteRollbackConfig.id}
    `;
    assert.equal(retainedConfigs.length, 1, 'audit failure must roll back config deletion');
    const retainedAudits = await auditsFor(deleteRollbackConfig.id);
    assert.deepEqual(
      retainedAudits.map(event => event.action),
      ['create'],
      'failed delete must not retain a delete audit event',
    );

    await removeKnownFixtures();
    const baseline = await sql<{ id: string }[]>`
      SELECT id
      FROM config_audit_log
      WHERE entity_type = 'wp_weight_config'
      ORDER BY id
    `;
    const [window] = await sql<[{ anchor: string; start_cursor_at: string }]>`
      SELECT
        to_char(
          coalesce(min(changed_at), '2400-01-01'::timestamptz) - interval '1 day',
          'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
        ) AS anchor,
        to_char(
          coalesce(min(changed_at), '2400-01-01'::timestamptz) - interval '1 day' + interval '1 second',
          'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
        ) AS start_cursor_at
      FROM config_audit_log
      WHERE entity_type = 'wp_weight_config'
    `;
    const startCursor = Buffer.from(JSON.stringify({
      v: 1,
      changed_at: window.start_cursor_at,
      id: 'ffffffff-ffff-4fff-bfff-ffffffffffff',
    })).toString('base64url');

    const nonWpId = randomUUID();
    await assert.rejects(
      sql`
        INSERT INTO config_audit_log
          (id, entity_type, entity_id, action, changed_by, old_value, new_value, changed_at)
        VALUES
          (${nonWpId}, 'target_wp_config', ${randomUUID()}, 'create', ${actor}, null,
           ${sql.json({ id: randomUUID() })}, ${window.anchor}::timestamptz - interval '5 microseconds')
      `,
      (error: unknown) => typeof error === 'object' && error !== null
        && 'constraint_name' in error
        && error.constraint_name === 'config_audit_log_entity_supported',
    );
    const rejectedDecoy = await sql<{ id: string }[]>`
      SELECT id FROM config_audit_log WHERE id = ${nonWpId}
    `;
    assert.equal(rejectedDecoy.length, 0, 'rejected non-WP decoy must leave no row');

    const exactTwenty = await insertAuditFixtures(20, window.anchor);
    const twentyPage = await service.fetchAuditLog(startCursor);
    assert.deepEqual(twentyPage, { items: exactTwenty, next_cursor: null });
    await removeKnownFixtures();

    const exactTwentyOne = await insertAuditFixtures(21, window.anchor);
    const firstPage = await service.fetchAuditLog(startCursor);
    assert.deepEqual(firstPage.items, exactTwentyOne.slice(0, 20));
    assert.equal(typeof firstPage.next_cursor, 'string');
    assert.match(firstPage.next_cursor!, /^[A-Za-z0-9_-]+$/);
    assert(firstPage.next_cursor!.length <= 512);
    const decodedCursor = JSON.parse(Buffer.from(firstPage.next_cursor!, 'base64url').toString('utf8'));
    assert.deepEqual(decodedCursor, {
      v: 1,
      changed_at: exactTwentyOne[19].changed_at,
      id: exactTwentyOne[19].id,
    });
    assert.equal(
      Buffer.from(JSON.stringify(decodedCursor)).toString('base64url'),
      firstPage.next_cursor,
      'cursor must be canonical unpadded base64url',
    );
    assert.match(decodedCursor.changed_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/);

    const [newer] = await insertAuditFixtures(1, window.anchor, 0);
    const secondPage = await service.fetchAuditLog(firstPage.next_cursor);
    assert.deepEqual(secondPage, { items: exactTwentyOne.slice(20), next_cursor: null });
    const traversedIds = [...firstPage.items, ...secondPage.items].map(row => row.id);
    assert.deepEqual(traversedIds, exactTwentyOne.map(row => row.id));
    assert.equal(new Set(traversedIds).size, 21, 'cursor traversal must not duplicate entries');
    assert(!traversedIds.includes(newer.id), 'a newer insertion must not shift the second page');
    await removeKnownFixtures();
    const baselineAfter = await sql<{ id: string }[]>`
      SELECT id
      FROM config_audit_log
      WHERE entity_type = 'wp_weight_config'
      ORDER BY id
    `;
    assert.deepEqual(baselineAfter, baseline, 'contract cleanup must preserve baseline audit rows');

    console.log('WP weight atomic audit and pagination contract: PASS');
  } finally {
    for (const date of fixtureDates) {
      const configs = await sql<{ id: string }[]>`
        SELECT id FROM wp_weight_config WHERE effective_date = ${date}
      `;
      configs.forEach(row => configIds.add(row.id));
      const audits = await sql<{ id: string }[]>`
        SELECT id FROM config_audit_log
        WHERE old_value->>'effective_date' = ${date}
           OR new_value->>'effective_date' = ${date}
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
