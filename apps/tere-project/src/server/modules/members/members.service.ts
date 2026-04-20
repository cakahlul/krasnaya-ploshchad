import { MembersRepository, membersRepository } from './members.repository';
import type { MemberEntity, MemberResponse, CreateMemberRequest, UpdateMemberRequest } from '@shared/types/member.types';
import type { TalentResponse } from '@shared/types/talent-leave.types';
import { MemoryCache } from '@server/lib/cache';

const CACHE_KEY = 'all_members';

class MembersService {
  private cache = new MemoryCache(60 * 60 * 1000); // 60 minutes

  constructor(private readonly repository: MembersRepository) {}

  private invalidateCache(): void {
    this.cache.invalidate();
  }

  async create(dto: CreateMemberRequest): Promise<MemberResponse> {
    this.invalidateCache();
    const now = new Date();
    const entity: MemberEntity = {
      name: dto.name,
      fullName: dto.fullName,
      email: dto.email,
      level: dto.level,
      isLead: dto.isLead,
      teams: dto.teams,
      isLead: dto.isLead ?? false,
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
      isLead: dto.isLead,
      teams: dto.teams,
      isLead: dto.isLead ?? false,
      createdAt: now,
      updatedAt: now,
    };
    const created = await this.repository.createWithId(id, entity);
    return this.entityToDto(created);
  }

  async findAll(): Promise<MemberResponse[]> {
    const cached = this.cache.get<MemberResponse[]>(CACHE_KEY);
    if (cached) return cached;

    const entities = await this.repository.findAll();
    const result = entities.map((e) => this.entityToDto(e));
    this.cache.set(CACHE_KEY, result);
    return result;
  }

  async findOne(id: string): Promise<MemberResponse> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new Error(`Member with ID '${id}' not found`);
    return this.entityToDto(entity);
  }

  async update(id: string, dto: UpdateMemberRequest): Promise<MemberResponse> {
    this.invalidateCache();
    const updateData: Partial<MemberEntity> = { updatedAt: new Date() };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.level !== undefined) updateData.level = dto.level;
    if (dto.isLead !== undefined) updateData.isLead = dto.isLead;
    if (dto.teams !== undefined) updateData.teams = dto.teams;
    if (dto.isLead !== undefined) updateData.isLead = dto.isLead;
    const updated = await this.repository.update(id, updateData);
    if (!updated) throw new Error(`Member with ID '${id}' not found`);
    return this.entityToDto(updated);
  }

  async remove(id: string): Promise<void> {
    this.invalidateCache();
    const entity = await this.repository.findById(id);
    if (!entity) throw new Error(`Member with ID '${id}' not found`);
    await this.repository.delete(id);
  }

  /** Returns members in TalentResponse shape for backwards-compatibility with talent-leave dropdown. */
  async findByEmail(email: string): Promise<MemberResponse | null> {
    const entity = await this.repository.findByEmail(email);
    if (!entity) return null;
    return this.entityToDto(entity);
  }

  async findAllAsTalents(): Promise<TalentResponse[]> {
    const members = await this.repository.findAll();
    return members.map((m) => ({
      id: m.id!,
      name: m.name,
      team: m.teams.join(', '),
    }));
  }

  private entityToDto(entity: MemberEntity): MemberResponse {
    return {
      id: entity.id!,
      name: entity.name,
      fullName: entity.fullName,
      email: entity.email,
      level: entity.level,
      isLead: entity.isLead,
      teams: entity.teams,
      isLead: entity.isLead ?? false,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}

export const membersService = new MembersService(membersRepository);
