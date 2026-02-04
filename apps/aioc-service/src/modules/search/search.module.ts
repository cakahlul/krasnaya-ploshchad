import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchJiraRepository } from './search.jira.repository';

@Module({
  controllers: [SearchController],
  providers: [SearchService, SearchJiraRepository],
  exports: [SearchService],
})
export class SearchModule {}
