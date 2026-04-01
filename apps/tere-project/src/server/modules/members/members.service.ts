import { MembersRepository, membersRepository } from './members.repository';
import type { MemberEntity, MemberResponse, CreateMemberRequest, UpdateMemberRequest } from '@shared/types/member.types';
import type { TalentResponse } from '@shared/types/talent-leave.types';

class MembersService {
  constructor(private readonly repository: MembersRepository) {}

  async create(dto: CreateMemberRequest): Promise<MemberResponse> {
    const now = new Date();
    const entity: MemberEntity = {
      name: dto.name,
      fullName: dto.fullName,
      email: dto.email,
      level: dto.level,
      teams: dto.teams,
      createdAt: now,
      updatedAt: now,
    };
    const created = await this.repository.create(entity);
    return this.entityToDto(created);
  }

  async createWithId(id: string, dto: CreateMemberRequest): Promise<MemberResponse> {
    const now = new Date();
    const entity: MemberEntity = {
      name: dto.name,
      fullName: dto.fullName,
      email: dto.email,
      level: dto.level,
      teams: dto.teams,
      createdAt: now,
      updatedAt: now,
    };
    const created = await this.repository.createWithId(id, entity);
    return this.entityToDto(created);
  }

  async findAll(): Promise<MemberResponse[]> {
    const entities = await this.repository.findAll();
    return entities.map((e) => this.entityToDto(e));
  }

  async findOne(id: string): Promise<MemberResponse> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new Error(`Member with ID '${id}' not found`);
    return this.entityToDto(entity);
  }

  async update(id: string, dto: UpdateMemberRequest): Promise<MemberResponse> {
    const updateData: Partial<MemberEntity> = { updatedAt: new Date() };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.level !== undefined) updateData.level = dto.level;
    if (dto.teams !== undefined) updateData.teams = dto.teams;
    const updated = await this.repository.update(id, updateData);
    if (!updated) throw new Error(`Member with ID '${id}' not found`);
    return this.entityToDto(updated);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new Error(`Member with ID '${id}' not found`);
    await this.repository.delete(id);
  }

  /** Returns members in TalentResponse shape for backwards-compatibility with talent-leave dropdown. */
  async findAllAsTalents(): Promise<TalentResponse[]> {
    const members = await this.repository.findAll();
    return members.map((m) => ({
      id: m.id!,
      name: m.name,
      team: m.teams.join(', '),
      role: m.level,
    }));
  }

  private entityToDto(entity: MemberEntity): MemberResponse {
    return {
      id: entity.id!,
      name: entity.name,
      fullName: entity.fullName,
      email: entity.email,
      level: entity.level,
      teams: entity.teams,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}

export const membersService = new MembersService(membersRepository);
