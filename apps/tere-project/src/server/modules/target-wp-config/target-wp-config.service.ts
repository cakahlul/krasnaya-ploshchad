import { TargetWpConfigRepository, type TargetWpConfig, type TargetWpRates } from './target-wp-config.repository';

class TargetWpConfigService {
  constructor(private readonly repo: TargetWpConfigRepository) {}

  async fetchAll(): Promise<TargetWpConfig[]> {
    return this.repo.fetchAll();
  }

  async getEffectiveRates(sprintStartDate: string): Promise<TargetWpRates> {
    return this.repo.getEffectiveRates(sprintStartDate);
  }

  async create(effective_date: string, rates: TargetWpRates): Promise<TargetWpConfig> {
    return this.repo.create(effective_date, rates);
  }

  async delete(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}

export const targetWpConfigService = new TargetWpConfigService(new TargetWpConfigRepository());
