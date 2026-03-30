import { TalentLeaveRepository, TalentLeaveEntity, LeaveFilterDto, talentLeaveRepository } from './talent-leave.repository';
import type { TalentLeaveResponse, CreateLeaveRequest, UpdateLeaveRequest } from '@shared/types/talent-leave.types';

class TalentLeaveService {
  constructor(private readonly repository: TalentLeaveRepository) {}

  async create(dto: CreateLeaveRequest): Promise<TalentLeaveResponse> {
    const existing = await this.repository.findByName(dto.name);
    if (existing) {
      if (dto.leaveDate && dto.leaveDate.length > 0) {
        const newLeaveDates = dto.leaveDate.map((leave) => ({ dateFrom: new Date(leave.dateFrom), dateTo: new Date(leave.dateTo), status: leave.status || 'Draft' }));
        const updatedLeaveDate = [...existing.leaveDate, ...newLeaveDates];
        const updated = await this.repository.update(existing.id!, { leaveDate: updatedLeaveDate, updatedAt: new Date() });
        if (!updated) throw new Error(`Leave record with ID '${existing.id}' not found`);
        return this.entityToDto(updated);
      }
      return this.entityToDto(existing);
    }
    const now = new Date();
    const entity: TalentLeaveEntity = {
      name: dto.name,
      team: dto.team,
      leaveDate: dto.leaveDate ? dto.leaveDate.map((leave) => ({ dateFrom: new Date(leave.dateFrom), dateTo: new Date(leave.dateTo), status: leave.status || 'Draft' })) : [],
      role: dto.role || '',
      createdAt: now,
      updatedAt: now,
    };
    const created = await this.repository.create(entity);
    return this.entityToDto(created);
  }

  async findAll(filters?: LeaveFilterDto): Promise<TalentLeaveResponse[]> {
    const entities = await this.repository.findAll(filters);
    return entities.map((entity) => this.entityToDto(entity));
  }

  async findOne(id: string): Promise<TalentLeaveResponse> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new Error(`Leave record with ID '${id}' not found`);
    return this.entityToDto(entity);
  }

  async update(id: string, dto: UpdateLeaveRequest): Promise<TalentLeaveResponse> {
    const updateData: Partial<TalentLeaveEntity> = { updatedAt: new Date() };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.team !== undefined) updateData.team = dto.team;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.leaveDate !== undefined) {
      updateData.leaveDate = dto.leaveDate.map((leave) => ({ dateFrom: new Date(leave.dateFrom), dateTo: new Date(leave.dateTo), status: leave.status || 'Draft' }));
    }
    const updated = await this.repository.update(id, updateData);
    if (!updated) throw new Error(`Leave record with ID '${id}' not found`);
    return this.entityToDto(updated);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new Error(`Leave record with ID '${id}' not found`);
    await this.repository.delete(id);
  }

  async findAllTeams(): Promise<string[]> {
    try {
      const teams = await this.repository.findAllTeams();
      if (teams.length === 0) return ['Lending', 'Funding'];
      return teams;
    } catch {
      return ['Lending', 'Funding'];
    }
  }

  async findAllTalents(): Promise<Array<{ id: string; name: string; team: string; role: string }>> {
    return this.repository.findAllTalents();
  }

  private entityToDto(entity: TalentLeaveEntity): TalentLeaveResponse {
    return {
      id: entity.id!,
      name: entity.name,
      team: entity.team,
      leaveDate: entity.leaveDate.map((leave) => ({
        dateFrom: formatDateWithoutTimezone(leave.dateFrom),
        dateTo: formatDateWithoutTimezone(leave.dateTo),
        status: leave.status,
      })),
      role: entity.role || '',
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}

function formatDateWithoutTimezone(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const talentLeaveService = new TalentLeaveService(talentLeaveRepository);
