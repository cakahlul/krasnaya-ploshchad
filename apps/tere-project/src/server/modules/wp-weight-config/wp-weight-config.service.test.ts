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
  create: async () => { throw new Error('should not insert duplicate'); },
  deleteFuture: async () => false,
};
const service = new WpWeightConfigService(repo, () => '2026-07-13');
async function main() {
  const duplicate = await service.create('2026-07-14', { ...weights });
  assert.equal(duplicate.created, false);
  assert.equal(duplicate.config, existing);

  await assert.rejects(
    service.delete(existing.id),
    (error: unknown) =>
      error instanceof WpWeightConfigError && error.code === 'IMMUTABLE_CONFIG',
  );

  let lookedUpAfterDelete = false;
  const atomicDeleteService = new WpWeightConfigService({
    ...repo,
    deleteFuture: async () => true,
    findById: async () => {
      lookedUpAfterDelete = true;
      return null;
    },
  });
  await atomicDeleteService.delete(existing.id);
  assert.equal(lookedUpAfterDelete, false);

  await assert.rejects(
    new WpWeightConfigService({
      ...repo,
      findById: async () => null,
    }).delete(existing.id),
    (error: unknown) =>
      error instanceof WpWeightConfigError && error.code === 'CONFIG_NOT_FOUND',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
