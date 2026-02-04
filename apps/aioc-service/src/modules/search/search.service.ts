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
}
