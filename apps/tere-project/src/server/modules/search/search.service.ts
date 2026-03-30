import { SearchRepository } from './search.repository';
import { SearchResultDto, TicketDetailDto } from '@shared/types/search.types';

class SearchService {
  constructor(private readonly repo: SearchRepository) {}

  async searchTickets(
    query: string,
    limit = 6,
    offset = 0,
    nextPageToken?: string,
  ): Promise<SearchResultDto> {
    const { tickets, total, nextPageToken: newToken } =
      await this.repo.searchTickets(query, limit, offset, nextPageToken);

    return {
      tickets,
      total: total ?? 0,
      hasMore: !!newToken,
      nextPageToken: newToken,
    };
  }

  async getTicketDetail(key: string): Promise<TicketDetailDto | null> {
    return this.repo.getTicketDetail(key);
  }

  async getTicketDetailBatch(keys: string[]): Promise<TicketDetailDto[]> {
    if (!keys.length) return [];
    const CONCURRENCY = 5;
    const results: TicketDetailDto[] = [];

    for (let i = 0; i < keys.length; i += CONCURRENCY) {
      const batch = keys.slice(i, i + CONCURRENCY);
      const settled = await Promise.all(
        batch.map((key) => this.repo.getTicketDetail(key).catch(() => null)),
      );
      results.push(...(settled.filter((r): r is TicketDetailDto => r !== null)));
    }

    return results;
  }
}

export const searchService = new SearchService(new SearchRepository());
