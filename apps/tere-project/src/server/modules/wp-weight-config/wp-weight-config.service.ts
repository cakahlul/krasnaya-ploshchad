import {
  WpWeightConfigRepository,
  type WpWeightConfig,
  type WpWeights,
} from './wp-weight-config.repository';
import { isStrictDate, todayInWib } from './wp-weight-config-date';

export type WpWeightConfigErrorCode =
  | 'VALIDATION_ERROR'
  | 'CONFIG_NOT_FOUND'
  | 'EFFECTIVE_DATE_CONFLICT'
  | 'IMMUTABLE_CONFIG';

export class WpWeightConfigError extends Error {
  constructor(
    readonly code: WpWeightConfigErrorCode,
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

const WEIGHT_KEYS: (keyof WpWeights)[] = ['Very Low', 'Low', 'Medium', 'High'];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateConfigInput(
  effectiveDate: unknown,
  weights: unknown,
  today = todayInWib(),
): { effective_date: string; weights: WpWeights } {
  const fields: Record<string, string> = {};
  if (!isStrictDate(effectiveDate)) {
    fields.effective_date = 'Must be a real date in YYYY-MM-DD format';
  } else if (effectiveDate <= today) {
    fields.effective_date = 'Must be later than today in Asia/Jakarta';
  }

  if (!weights || typeof weights !== 'object' || Array.isArray(weights)) {
    fields.weights = 'Must contain exactly Very Low, Low, Medium, and High';
  } else {
    const entries = Object.entries(weights);
    const exactKeys = entries.length === WEIGHT_KEYS.length
      && WEIGHT_KEYS.every(key => Object.hasOwn(weights, key));
    const validValues = entries.every(([, value]) =>
      typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 100,
    );
    if (!exactKeys || !validValues) {
      fields.weights = 'Must contain exactly four numeric values greater than 0 and at most 100';
    }
  }

  if (Object.keys(fields).length > 0) {
    throw new WpWeightConfigError(
      'VALIDATION_ERROR',
      'Invalid WP weight config',
      400,
      fields,
    );
  }
  return { effective_date: effectiveDate as string, weights: weights as WpWeights };
}

function sameWeights(left: WpWeights, right: WpWeights): boolean {
  return WEIGHT_KEYS.every(key => left[key] === right[key]);
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error
    && (error as { code?: unknown }).code === '23505';
}

type Repository = Pick<
  WpWeightConfigRepository,
  'fetchAll' | 'getEffectiveWeights' | 'findByEffectiveDate' | 'findById' | 'createWithAudit' | 'deleteFutureWithAudit'
>;

export class WpWeightConfigService {
  constructor(
    private readonly repo: Repository,
    private readonly getToday: () => string = todayInWib,
  ) {}

  fetchAll(): Promise<WpWeightConfig[]> {
    return this.repo.fetchAll();
  }

  getEffectiveWeights(date: string): Promise<WpWeights> {
    if (!isStrictDate(date)) {
      throw new WpWeightConfigError(
        'VALIDATION_ERROR',
        'Invalid effective date',
        400,
        { date: 'Must be a real date in YYYY-MM-DD format' },
      );
    }
    return this.repo.getEffectiveWeights(date);
  }

  async create(
    effectiveDate: unknown,
    inputWeights: unknown,
    changedBy: string,
  ): Promise<{ config: WpWeightConfig; created: boolean }> {
    const { effective_date, weights } = validateConfigInput(
      effectiveDate,
      inputWeights,
      this.getToday(),
    );
    const existing = await this.repo.findByEffectiveDate(effective_date);
    if (existing) return this.resolveDuplicate(existing, weights);

    try {
      return { config: await this.repo.createWithAudit(effective_date, weights, changedBy), created: true };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const raced = await this.repo.findByEffectiveDate(effective_date);
      if (!raced) throw error;
      return this.resolveDuplicate(raced, weights);
    }
  }

  async delete(id: string, changedBy: string): Promise<void> {
    if (!UUID_PATTERN.test(id)) {
      throw new WpWeightConfigError('CONFIG_NOT_FOUND', 'WP weight config not found', 404);
    }
    if (await this.repo.deleteFutureWithAudit(id, changedBy)) return;

    if (await this.repo.findById(id)) {
      throw new WpWeightConfigError(
        'IMMUTABLE_CONFIG',
        'Active and historical WP weight configs cannot be deleted',
        409,
      );
    }
    throw new WpWeightConfigError('CONFIG_NOT_FOUND', 'WP weight config not found', 404);
  }

  private resolveDuplicate(
    existing: WpWeightConfig,
    weights: WpWeights,
  ): { config: WpWeightConfig; created: false } {
    if (sameWeights(existing.weights, weights)) return { config: existing, created: false };
    throw new WpWeightConfigError(
      'EFFECTIVE_DATE_CONFLICT',
      'A different WP weight config already exists for this effective date',
      409,
    );
  }
}

export const wpWeightConfigService = new WpWeightConfigService(new WpWeightConfigRepository());
