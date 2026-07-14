import assert from 'node:assert/strict';
import {
  WpWeightConfigError,
  WpWeightConfigService,
  validateConfigInput,
} from './wp-weight-config.service';
import { isStrictDate, todayInWib } from './wp-weight-config-date';
import type {
  WpWeightConfig,
  WpWeights,
} from './wp-weight-config.repository';

const weights: WpWeights = {
  'Very Low': 1.5,
  Low: 2,
  Medium: 4,
  High: 8,
};

assert.equal(isStrictDate('2024-02-29'), true);
assert.equal(isStrictDate('2023-02-29'), false);
assert.equal(isStrictDate('2024-2-29'), false);
assert.equal(todayInWib(new Date('2026-07-13T17:30:00.000Z')), '2026-07-14');
assert.deepEqual(validateConfigInput('2026-07-14', weights, '2026-07-13'), {
  effective_date: '2026-07-14',
  weights,
});
assert.throws(
  () => validateConfigInput('2026-07-13', weights, '2026-07-13'),
  (error: unknown) =>
    error instanceof WpWeightConfigError && error.code === 'VALIDATION_ERROR',
);
assert.throws(
  () => validateConfigInput('2026-07-14', { ...weights, Extra: 1 }, '2026-07-13'),
  (error: unknown) =>
    error instanceof WpWeightConfigError && error.code === 'VALIDATION_ERROR',
);

const existing: WpWeightConfig = {
  id: '77f8489c-5dd1-4455-8a1c-d5a7cd318dca',
  effective_date: '2026-07-14',
  weights,
};
const repo = {
  fetchAll: async () => [existing],
  getEffectiveWeights: async () => weights,
  findByEffectiveDate: async () => existing,
  findById: async () => ({ ...existing, effective_date: '2026-07-13' }),
  createWithAudit: async () => {
    throw new Error('should not insert duplicate');
  },
  deleteFutureWithAudit: async () => null,
};
const service = new WpWeightConfigService(repo, () => '2026-07-13');
async function main() {
  const duplicate = await service.create(
    '2026-07-14',
    { ...weights },
    'lead@amarbank.co.id',
  );
  assert.equal(duplicate.created, false);
  assert.equal(duplicate.config, existing);

  let createdBy = '';
  const createService = new WpWeightConfigService(
    {
      ...repo,
      findByEffectiveDate: async () => null,
      createWithAudit: async (_date, _weights, actor) => {
        createdBy = actor;
        return existing;
      },
    },
    () => '2026-07-13',
  );
  assert.equal(
    (await createService.create('2026-07-14', weights, 'lead@amarbank.co.id'))
      .created,
    true,
  );
  assert.equal(createdBy, 'lead@amarbank.co.id');

  let raceLookup = 0;
  let racedBy = '';
  const raced = await new WpWeightConfigService(
    {
      ...repo,
      findByEffectiveDate: async () => (raceLookup++ === 0 ? null : existing),
      createWithAudit: async (_date, _weights, actor) => {
        racedBy = actor;
        throw { code: '23505' };
      },
    },
    () => '2026-07-13',
  ).create('2026-07-14', weights, 'lead@amarbank.co.id');
  assert.equal(raced.created, false);
  assert.equal(racedBy, 'lead@amarbank.co.id');

  const auditFailure = new Error('audit failed');
  await assert.rejects(
    new WpWeightConfigService(
      {
        ...repo,
        findByEffectiveDate: async () => null,
        createWithAudit: async () => {
          throw auditFailure;
        },
      },
      () => '2026-07-13',
    ).create('2026-07-14', weights, 'lead@amarbank.co.id'),
    auditFailure,
  );

  await assert.rejects(
    service.delete(existing.id, 'lead@amarbank.co.id'),
    (error: unknown) =>
      error instanceof WpWeightConfigError && error.code === 'IMMUTABLE_CONFIG',
  );

  let lookedUpAfterDelete = false;
  let deletedBy = '';
  const atomicDeleteService = new WpWeightConfigService({
    ...repo,
    deleteFutureWithAudit: async (_id, actor) => {
      deletedBy = actor;
      return existing;
    },
    findById: async () => {
      lookedUpAfterDelete = true;
      return null;
    },
  });
  await atomicDeleteService.delete(existing.id, 'lead@amarbank.co.id');
  assert.equal(lookedUpAfterDelete, false);
  assert.equal(deletedBy, 'lead@amarbank.co.id');

  await assert.rejects(
    new WpWeightConfigService({
      ...repo,
      deleteFutureWithAudit: async () => {
        throw auditFailure;
      },
    }).delete(existing.id, 'lead@amarbank.co.id'),
    auditFailure,
  );

  await assert.rejects(
    new WpWeightConfigService({
      ...repo,
      findById: async () => null,
    }).delete(existing.id, 'lead@amarbank.co.id'),
    (error: unknown) =>
      error instanceof WpWeightConfigError && error.code === 'CONFIG_NOT_FOUND',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
