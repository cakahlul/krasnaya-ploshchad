import { WpWeightConfigRepository, type WpWeightConfig, type WpWeights } from './wp-weight-config.repository';

class WpWeightConfigService {
  constructor(private readonly repo: WpWeightConfigRepository) {}

  async fetchAll(): Promise<WpWeightConfig[]> {
    return this.repo.fetchAll();
  }

  async getEffectiveWeights(sprintStartDate: string): Promise<WpWeights> {
    return this.repo.getEffectiveWeights(sprintStartDate);
  }

  async create(effective_date: string, weights: WpWeights): Promise<WpWeightConfig> {
    return this.repo.create(effective_date, weights);
  }

  async delete(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}

export const wpWeightConfigService = new WpWeightConfigService(new WpWeightConfigRepository());
