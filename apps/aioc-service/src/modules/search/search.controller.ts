import {
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchResultDto, TicketDetailDto } from './interfaces/search.dto';

@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  /**
   * Search for JIRA tickets
   * @param q - Search query string
   * @param limit - Maximum number of results (default: 6)
   * @param offset - Pagination offset (default: 0)
   */
  @Get('tickets')
  async searchTickets(
    @Query('q') q: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('nextPageToken') nextPageToken?: string,
  ): Promise<SearchResultDto> {
    
    const parsedLimit = limit ? parseInt(limit, 10) : 6;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    return this.searchService.searchTickets(
      q || '',
      isNaN(parsedLimit) ? 6 : Math.min(parsedLimit, 50),
      isNaN(parsedOffset) ? 0 : parsedOffset,
      nextPageToken,
    );
  }

  /**
   * Get detailed information about a specific ticket
   * @param key - JIRA issue key (e.g., DS-1234)
   */
  @Get('tickets/:key')
  async getTicketDetail(@Param('key') key: string): Promise<TicketDetailDto> {
    this.logger.log(`Ticket detail request: ${key}`);

    const detail = await this.searchService.getTicketDetail(key);

    if (!detail) {
      throw new NotFoundException(`Ticket ${key} not found`);
    }

    return detail;
  }
}
