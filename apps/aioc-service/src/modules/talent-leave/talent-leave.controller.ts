import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TalentLeaveService } from './talent-leave.service';
import {
  CreateTalentLeaveDto,
  UpdateTalentLeaveDto,
  TalentLeaveResponseDto,
} from './interfaces/talent-leave.dto';

@Controller('talent-leave')
export class TalentLeaveController {
  constructor(private readonly service: TalentLeaveService) {}

  // SPECIFIC ROUTES FIRST - teams and talents endpoints must come before :id route
  @Get('teams')
  @HttpCode(HttpStatus.OK)
  async getTeams(): Promise<string[]> {
    return this.service.findAllTeams();
  }

  @Get('talents')
  @HttpCode(HttpStatus.OK)
  async getTalents(): Promise<
    Array<{
      id: string;
      name: string;
      team: string;
      role: string;
    }>
  > {
    return await this.service.findAllTalents();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTalentLeaveDto,
  ): Promise<TalentLeaveResponseDto> {
    // Validate required fields
    if (!dto.name || dto.name.trim() === '') {
      throw new BadRequestException('name is required');
    }
    if (!dto.team || dto.team.trim() === '') {
      throw new BadRequestException('team is required');
    }
    if (!dto.role || dto.role.trim() === '') {
      throw new BadRequestException('role is required');
    }

    // Validate leaveDate if provided
    if (dto.leaveDate !== undefined) {
      if (!Array.isArray(dto.leaveDate)) {
        throw new BadRequestException('leaveDate must be an array');
      }

      // Validate each leave date range
      for (let i = 0; i < dto.leaveDate.length; i++) {
        const leave = dto.leaveDate[i];
        if (!leave.dateFrom) {
          throw new BadRequestException(`leaveDate[${i}].dateFrom is required`);
        }
        if (!leave.dateTo) {
          throw new BadRequestException(`leaveDate[${i}].dateTo is required`);
        }
        if (!leave.status || leave.status.trim() === '') {
          throw new BadRequestException(`leaveDate[${i}].status is required`);
        }

        // Validate timestamp formats
        if (!this.service.isValidTimestamp(leave.dateFrom)) {
          throw new BadRequestException(
            `leaveDate[${i}].dateFrom must be a valid ISO 8601 timestamp`,
          );
        }
        if (!this.service.isValidTimestamp(leave.dateTo)) {
          throw new BadRequestException(
            `leaveDate[${i}].dateTo must be a valid ISO 8601 timestamp`,
          );
        }

        // Validate date range
        if (!this.service.validateDateRange(leave.dateFrom, leave.dateTo)) {
          throw new BadRequestException(
            `leaveDate[${i}].dateTo must be greater than or equal to dateFrom`,
          );
        }
      }
    }

    return this.service.create(dto);
  }

  @Get()
  async findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('team') team?: string,
  ): Promise<TalentLeaveResponseDto[]> {
    const filters =
      startDate || endDate || status || team
        ? { startDate, endDate, status, team }
        : undefined;

    return this.service.findAll(filters);
  }

  // PARAMETERIZED ROUTES LAST - :id route must come after 'teams'
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TalentLeaveResponseDto> {
    return this.service.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTalentLeaveDto,
  ): Promise<TalentLeaveResponseDto> {
    // Validate role if provided (cannot be empty string)
    if (dto.role !== undefined && dto.role.trim() === '') {
      throw new BadRequestException('role cannot be empty');
    }

    // Validate leaveDate array if provided
    if (dto.leaveDate !== undefined) {
      if (!Array.isArray(dto.leaveDate)) {
        throw new BadRequestException('leaveDate must be an array');
      }

      // Allow empty array (user can remove all leave dates)
      // Only validate if array has items
      for (let i = 0; i < dto.leaveDate.length; i++) {
        const leave = dto.leaveDate[i];
        if (!leave.dateFrom) {
          throw new BadRequestException(`leaveDate[${i}].dateFrom is required`);
        }
        if (!leave.dateTo) {
          throw new BadRequestException(`leaveDate[${i}].dateTo is required`);
        }
        if (!leave.status || leave.status.trim() === '') {
          throw new BadRequestException(`leaveDate[${i}].status is required`);
        }

        // Validate timestamp formats
        if (!this.service.isValidTimestamp(leave.dateFrom)) {
          throw new BadRequestException(
            `leaveDate[${i}].dateFrom must be a valid ISO 8601 timestamp`,
          );
        }
        if (!this.service.isValidTimestamp(leave.dateTo)) {
          throw new BadRequestException(
            `leaveDate[${i}].dateTo must be a valid ISO 8601 timestamp`,
          );
        }

        // Validate date range
        if (!this.service.validateDateRange(leave.dateFrom, leave.dateTo)) {
          throw new BadRequestException(
            `leaveDate[${i}].dateTo must be greater than or equal to dateFrom`,
          );
        }
      }
    }

    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
