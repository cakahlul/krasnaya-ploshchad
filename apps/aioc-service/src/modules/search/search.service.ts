import { Injectable, Logger } from '@nestjs/common';
import { SearchJiraRepository } from './search.jira.repository';
import { SearchResultDto, TicketDetailDto } from './interfaces/search.dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly searchJiraRepository: SearchJiraRepository) {}

  /**
   * Search for tickets matching the query
   */
  async searchTickets(
    query: string,
    limit: number = 6,
    offset: number = 0,
    nextPageToken?: string,
  ): Promise<SearchResultDto> {
    const { tickets, total, nextPageToken: newToken } = await this.searchJiraRepository.searchTickets(
      query,
      limit,
      offset,
      nextPageToken,
    );

    const hasMore = !!newToken; // If a token exists, there are more results

    return {
      tickets,
      total: total ?? 0,
      hasMore,
      nextPageToken: newToken,
    };
  }

  /**
   * Get detailed information about a specific ticket
   */
  async getTicketDetail(key: string): Promise<TicketDetailDto | null> {
    this.logger.log(`Fetching ticket detail: ${key}`);
    return this.searchJiraRepository.getTicketDetail(key);
  }

  /**
   * Batch fetch ticket details for multiple keys.
   * Fetches in parallel with concurrency control to avoid Jira rate limits.
   */
  async getTicketDetailBatch(keys: string[]): Promise<TicketDetailDto[]> {
    if (keys.length === 0) return [];

    // Fetch in batches of 5 to respect Jira rate limits
    const CONCURRENCY = 5;
    const results: TicketDetailDto[] = [];

    for (let i = 0; i < keys.length; i += CONCURRENCY) {
      const batch = keys.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map((key) =>
          this.searchJiraRepository.getTicketDetail(key).catch((err) => {
            this.logger.warn(`Failed to fetch detail for ${key}: ${err.message}`);
            return null;
          }),
        ),
      );
      results.push(
        ...batchResults.filter((r): r is TicketDetailDto => r !== null),
      );
    }

    return results;
  }
}
