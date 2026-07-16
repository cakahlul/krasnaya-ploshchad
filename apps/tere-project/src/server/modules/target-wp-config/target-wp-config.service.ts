import {
  TargetWpConfigRepository,
  type TargetWpAuditEntry,
  type TargetWpConfig,
  type TargetWpRates,
} from './target-wp-config.repository';
import { MemoryCache } from '@server/lib/cache';
import {
  decodeAuditCursor as decodeSharedAuditCursor,
  paginate,
  InvalidAuditCursorError,
} from '@server/modules/config-audit-log';

export type TargetWpConfigErrorCode = 'VALIDATION_ERROR';

export class TargetWpConfigError extends Error {
  constructor(
    readonly code: TargetWpConfigErrorCode,
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

function decodeAuditCursor(cursor: string) {
  try {
    return decodeSharedAuditCursor(cursor);
  } catch (error) {
    if (error instanceof InvalidAuditCursorError) {
      throw new TargetWpConfigError('VALIDATION_ERROR', 'Invalid audit cursor', 400, {
        cursor: 'Invalid cursor',
      });
    }
    throw error;
  }
}

type Repository = Pick<
  TargetWpConfigRepository,
  'createWithAudit' | 'deleteWithAudit' | 'fetchAuditLog' | 'fetchAll' | 'getEffectiveRates'
>;

export class TargetWpConfigService {
  private cache = new MemoryCache(60 * 60 * 1000); // 60 minutes

  constructor(private readonly repo: Repository) {}

  async fetchAll(): Promise<TargetWpConfig[]> {
    const cached = this.cache.get<TargetWpConfig[]>('all');
    if (cached) return cached;

    const result = await this.repo.fetchAll();
    this.cache.set('all', result);
    return result;
  }

  async getEffectiveRates(sprintStartDate: string): Promise<TargetWpRates> {
    const cacheKey = `rates_${sprintStartDate}`;
    const cached = this.cache.get<TargetWpRates>(cacheKey);
    if (cached) return cached;

    const result = await this.repo.getEffectiveRates(sprintStartDate);
    this.cache.set(cacheKey, result);
    return result;
  }

  async create(effective_date: string, rates: TargetWpRates, changedBy: string): Promise<TargetWpConfig> {
    for (const [level, rate] of Object.entries(rates)) {
      if (!(rate > 0)) {
        throw new TargetWpConfigError('VALIDATION_ERROR', 'rate harus > 0', 400, {
          [level]: 'rate harus > 0',
        });
      }
    }
    this.cache.invalidate();
    return this.repo.createWithAudit(effective_date, rates, changedBy);
  }

  async delete(id: string, changedBy: string): Promise<void> {
    this.cache.invalidate();
    await this.repo.deleteWithAudit(id, changedBy);
  }

  async fetchAuditLog(cursor: string | null): Promise<{
    items: TargetWpAuditEntry[];
    next_cursor: string | null;
  }> {
    const rows = await this.repo.fetchAuditLog(cursor === null ? null : decodeAuditCursor(cursor));
    return paginate(rows);
  }
}

export const targetWpConfigService = new TargetWpConfigService(new TargetWpConfigRepository());
