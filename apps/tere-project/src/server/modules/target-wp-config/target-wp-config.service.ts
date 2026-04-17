import { TargetWpConfigRepository, type TargetWpConfig, type TargetWpRates } from './target-wp-config.repository';
import { MemoryCache } from '@server/lib/cache';

class TargetWpConfigService {
  private cache = new MemoryCache(60 * 60 * 1000); // 60 minutes

  constructor(private readonly repo: TargetWpConfigRepository) {}

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

  async create(effective_date: string, rates: TargetWpRates): Promise<TargetWpConfig> {
    this.cache.invalidate();
    return this.repo.create(effective_date, rates);
  }

  async delete(id: string): Promise<void> {
    this.cache.invalidate();
    return this.repo.delete(id);
  }
}

export const targetWpConfigService = new TargetWpConfigService(new TargetWpConfigRepository());
