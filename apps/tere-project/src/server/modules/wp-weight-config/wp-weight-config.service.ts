import { WpWeightConfigRepository, type WpWeightConfig, type WpWeights } from './wp-weight-config.repository';
import { MemoryCache } from '@server/lib/cache';

class WpWeightConfigService {
  private cache = new MemoryCache(60 * 60 * 1000); // 60 minutes

  constructor(private readonly repo: WpWeightConfigRepository) {}

  async fetchAll(): Promise<WpWeightConfig[]> {
    const cached = this.cache.get<WpWeightConfig[]>('all');
    if (cached) return cached;

    const result = await this.repo.fetchAll();
    this.cache.set('all', result);
    return result;
  }

  async getEffectiveWeights(sprintStartDate: string): Promise<WpWeights> {
    const cacheKey = `weights_${sprintStartDate}`;
    const cached = this.cache.get<WpWeights>(cacheKey);
    if (cached) return cached;

    const result = await this.repo.getEffectiveWeights(sprintStartDate);
    this.cache.set(cacheKey, result);
    return result;
  }

  async create(effective_date: string, weights: WpWeights): Promise<WpWeightConfig> {
    this.cache.invalidate();
    return this.repo.create(effective_date, weights);
  }

  async delete(id: string): Promise<void> {
    this.cache.invalidate();
    return this.repo.delete(id);
  }
}

export const wpWeightConfigService = new WpWeightConfigService(new WpWeightConfigRepository());
