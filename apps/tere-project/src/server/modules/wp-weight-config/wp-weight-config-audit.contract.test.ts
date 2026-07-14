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

    console.log('WP weight atomic audit contract: PASS');
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
    for (const id of configIds) {
      await sql`DELETE FROM wp_weight_config WHERE id = ${id}`;
    }
    for (const id of auditIds) {
      await sql`DELETE FROM config_audit_log WHERE id = ${id}`;
    }
    await sql.end();
    await db.$client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
