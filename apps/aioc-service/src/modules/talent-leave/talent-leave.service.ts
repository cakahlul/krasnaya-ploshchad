import { Injectable, NotFoundException } from '@nestjs/common';
import { TalentLeaveRepository } from './repositories/talent-leave.repository';
import {
  CreateTalentLeaveDto,
  UpdateTalentLeaveDto,
  TalentLeaveResponseDto,
  LeaveFilterDto,
} from './interfaces/talent-leave.dto';
import { TalentLeaveEntity } from './interfaces/talent-leave.entity';
import {
  TEAM_LENDING,
  TEAM_FUNDING,
} from '../../shared/constants/team-member.const';

@Injectable()
export class TalentLeaveService {
  constructor(private readonly repository: TalentLeaveRepository) {}

  async create(dto: CreateTalentLeaveDto): Promise<TalentLeaveResponseDto> {
    // Check if a record with the same name already exists
    const existing = await this.repository.findByName(dto.name);

    if (existing) {
      // If record exists and leaveDate is provided, append to existing leaveDate array
      if (dto.leaveDate && dto.leaveDate.length > 0) {
        const newLeaveDates = dto.leaveDate.map((leave) => ({
          dateFrom: new Date(leave.dateFrom),
          dateTo: new Date(leave.dateTo),
          status: leave.status,
        }));

        const updatedLeaveDate = [...existing.leaveDate, ...newLeaveDates];

        const updateData: Partial<TalentLeaveEntity> = {
          leaveDate: updatedLeaveDate,
          updatedAt: new Date(),
        };

        const updated = await this.repository.update(existing.id!, updateData);
        if (!updated) {
          throw new NotFoundException(
            `Leave record with ID '${existing.id}' not found`,
          );
        }
        return this.entityToDto(updated);
      }

      // If record exists but no leaveDate provided, return existing record
      return this.entityToDto(existing);
    }

    // If no existing record, create new one
    const now = new Date();
    const entity: TalentLeaveEntity = {
      name: dto.name,
      team: dto.team,
      leaveDate: dto.leaveDate
        ? dto.leaveDate.map((leave) => ({
            dateFrom: new Date(leave.dateFrom),
            dateTo: new Date(leave.dateTo),
            status: leave.status,
          }))
        : [],
      role: dto.role,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.repository.create(entity);
    return this.entityToDto(created);
  }

  async findAll(filters?: LeaveFilterDto): Promise<TalentLeaveResponseDto[]> {
    const entities = await this.repository.findAll(filters);
    return entities.map((entity) => this.entityToDto(entity));
  }

  async findOne(id: string): Promise<TalentLeaveResponseDto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Leave record with ID '${id}' not found`);
    }
    return this.entityToDto(entity);
  }

  async update(
    id: string,
    dto: UpdateTalentLeaveDto,
  ): Promise<TalentLeaveResponseDto> {
    const updateData: Partial<TalentLeaveEntity> = {
      updatedAt: new Date(),
    };

    // Copy scalar fields
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.team !== undefined) updateData.team = dto.team;
    if (dto.role !== undefined) updateData.role = dto.role;

    // Convert leaveDate array if provided (allow empty array to remove all leave dates)
    if (dto.leaveDate !== undefined) {
      updateData.leaveDate = dto.leaveDate.map((leave) => ({
        dateFrom: new Date(leave.dateFrom),
        dateTo: new Date(leave.dateTo),
        status: leave.status,
      }));
    }

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Leave record with ID '${id}' not found`);
    }
    return this.entityToDto(updated);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Leave record with ID '${id}' not found`);
    }
    await this.repository.delete(id);
  }

  private entityToDto(entity: TalentLeaveEntity): TalentLeaveResponseDto {
    return {
      id: entity.id!,
      name: entity.name,
      team: entity.team,
      leaveDate: entity.leaveDate.map((leave) => ({
        dateFrom: this.formatDateWithoutTimezone(leave.dateFrom),
        dateTo: this.formatDateWithoutTimezone(leave.dateTo),
        status: leave.status,
      })),
      role: entity.role || '',
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * Format date as YYYY-MM-DD without timezone conversion
   * @param date - Date object
   * @returns Formatted date string in YYYY-MM-DD format
   */
  private formatDateWithoutTimezone(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Validation helpers
  isValidTimestamp(timestamp: string): boolean {
    if (!timestamp || timestamp.trim() === '') {
      return false;
    }
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
  }

  validateDateRange(dateFrom: string, dateTo: string): boolean {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    return to >= from;
  }

  /**
   * Fetch all unique team names from Firestore with fallback to hardcoded teams
   * @returns Array of unique team names
   */
  async findAllTeams(): Promise<string[]> {
    try {
      const teams = await this.repository.findAllTeams();

      // If no teams found, return hardcoded fallback
      if (teams.length === 0) {
        return [TEAM_LENDING, TEAM_FUNDING];
      }

      return teams;
    } catch (error) {
      console.error('Service error fetching teams:', error);
      // Return fallback on error
      return [TEAM_LENDING, TEAM_FUNDING];
    }
  }

  /**
   * Fetch all talents (team members) from Firestore
   * @returns Array of talent records with resolved team and role names
   */
  async findAllTalents(): Promise<
    Array<{
      id: string;
      name: string;
      team: string;
      role: string;
    }>
  > {
    return this.repository.findAllTalents();
  }
}
