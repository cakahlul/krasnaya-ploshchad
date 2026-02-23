import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { HolidaysRepository, Holiday } from './holidays.repository';

@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysRepository: HolidaysRepository) {}

  @Get()
  async getAll(): Promise<Holiday[]> {
    return this.holidaysRepository.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: { date: string; name: string; is_national_holiday?: boolean }): Promise<Holiday> {
    if (!data.date || !data.name) {
      throw new BadRequestException('Date and name are required');
    }
    return this.holidaysRepository.create(data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.holidaysRepository.delete(id);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreate(
    @Body() data: Array<{ date: string; name: string }>
  ): Promise<{ message: string; count: number }> {
    if (!Array.isArray(data) || data.length === 0) {
      throw new BadRequestException('Provide an array of holidays');
    }
    await this.holidaysRepository.bulkCreate(data);
    return { message: 'Bulk insert successful', count: data.length };
  }
}
