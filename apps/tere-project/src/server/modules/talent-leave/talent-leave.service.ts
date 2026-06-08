import { TalentLeaveRepository, TalentLeaveEntity, LeaveFilterDto, talentLeaveRepository } from './talent-leave.repository';
import type { TalentLeaveResponse, CreateLeaveRequest, UpdateLeaveRequest } from '@shared/types/talent-leave.types';
import { membersService } from '@server/modules/members/members.service';
import { userAccessService } from '@server/modules/user-access/user-access.service';

class TalentLeaveService {
  constructor(private readonly repository: TalentLeaveRepository) {}

  async create(dto: CreateLeaveRequest, requesterEmail?: string): Promise<TalentLeaveResponse> {
    const member = await this.getAuthorizedMember(dto.memberId, requesterEmail);
    const existing = await this.repository.findByMemberId(dto.memberId);
    if (existing) {
      if (dto.leaveDate && dto.leaveDate.length > 0) {
        const newLeaveDates = dto.leaveDate.map((leave) => ({ dateFrom: new Date(leave.dateFrom), dateTo: new Date(leave.dateTo), status: this.normalizeStatus(leave.status) }));
        const updatedLeaveDate = [...existing.leaveDate, ...newLeaveDates];
        const updated = await this.repository.update(existing.id!, { leaveDate: updatedLeaveDate, updatedAt: new Date() });
        if (!updated) throw new Error(`Leave record with ID '${existing.id}' not found`);
        return this.entityToDto(updated);
      }
      return this.entityToDto(existing);
    }
    const now = new Date();
    const entity: TalentLeaveEntity = {
      memberId: dto.memberId,
      name: member.name,
      team: member.teams.join(', '),
      leaveDate: dto.leaveDate ? dto.leaveDate.map((leave) => ({ dateFrom: new Date(leave.dateFrom), dateTo: new Date(leave.dateTo), status: this.normalizeStatus(leave.status) })) : [],
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

  async update(id: string, dto: UpdateLeaveRequest, requesterEmail?: string): Promise<TalentLeaveResponse> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new Error(`Leave record with ID '${id}' not found`);
    await this.assertCanMutate(entity.memberId, requesterEmail);
    const updateData: Partial<TalentLeaveEntity> = { updatedAt: new Date() };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.team !== undefined) updateData.team = dto.team;
    if (dto.leaveDate !== undefined) {
      updateData.leaveDate = dto.leaveDate.map((leave) => ({ dateFrom: new Date(leave.dateFrom), dateTo: new Date(leave.dateTo), status: this.normalizeStatus(leave.status) }));
    }
    const updated = await this.repository.update(id, updateData);
    if (!updated) throw new Error(`Leave record with ID '${id}' not found`);
    return this.entityToDto(updated);
  }

  async remove(id: string, requesterEmail?: string): Promise<void> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new Error(`Leave record with ID '${id}' not found`);
    await this.assertCanMutate(entity.memberId, requesterEmail);
    await this.repository.delete(id);
  }

  async findAllTalents(): Promise<Array<{ id: string; name: string; team: string }>> {
    return membersService.findAllAsTalents();
  }

  private async getAuthorizedMember(memberId: string, requesterEmail?: string) {
    const member = await membersService.findByJiraId(memberId);
    if (!member) throw new Error(`Member with Jira ID '${memberId}' not found`);
    await this.assertCanMutate(memberId, requesterEmail, member.email);
    return member;
  }

  private async assertCanMutate(memberId: string, requesterEmail?: string, memberEmail?: string) {
    if (!requesterEmail) throw new Error('Unauthorized');
    const role = await userAccessService.getUserRole(requesterEmail);
    if (role === 'Lead') return;
    const member = memberEmail ? { email: memberEmail } : await membersService.findByJiraId(memberId);
    if (!member || member.email !== requesterEmail) throw new Error('Forbidden');
  }

  private normalizeStatus(status?: string) {
    if (status === 'Sick') return 'Sick' as const;
    return 'Leave' as const;
  }

  private entityToDto(entity: TalentLeaveEntity): TalentLeaveResponse {
    return {
      id: entity.id!,
      memberId: entity.memberId,
      name: entity.name,
      team: entity.team,
      leaveDate: entity.leaveDate.map((leave) => ({
        dateFrom: formatDateWithoutTimezone(leave.dateFrom),
        dateTo: formatDateWithoutTimezone(leave.dateTo),
        status: leave.status,
      })),
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
