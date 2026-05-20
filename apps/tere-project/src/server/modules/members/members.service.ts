import { MembersRepository, membersRepository } from './members.repository';
import type {
  MemberEntity,
  MemberResponse,
  CreateMemberRequest,
  UpdateMemberRequest,
} from '@shared/types/member.types';
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
      jiraId: dto.jiraId ?? null,
      name: dto.name,
      fullName: dto.fullName,
      email: dto.email,
      level: dto.level,
      teams: dto.teams,
      isLead: dto.isLead ?? false,
      createdAt: now,
      updatedAt: now,
    };
    const created = await this.repository.create(entity);
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

  async findByJiraId(jiraId: string): Promise<MemberResponse | null> {
    const entity = await this.repository.findByJiraId(jiraId);
    if (!entity) return null;
    return this.entityToDto(entity);
  }

  async update(id: string, dto: UpdateMemberRequest): Promise<MemberResponse> {
    this.invalidateCache();
    const updateData: Partial<MemberEntity> = { updatedAt: new Date() };
    if (dto.jiraId !== undefined) updateData.jiraId = dto.jiraId;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.level !== undefined) updateData.level = dto.level;
    if (dto.isLead !== undefined) updateData.isLead = dto.isLead;
    if (dto.teams !== undefined) updateData.teams = dto.teams;
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

  async findByEmail(email: string): Promise<MemberResponse | null> {
    const entity = await this.repository.findByEmail(email);
    if (!entity) return null;
    return this.entityToDto(entity);
  }

  /** Returns members as TalentResponse — `id` is the Jira accountId, used as the natural key for talent-leave. */
  async findAllAsTalents(): Promise<TalentResponse[]> {
    const members = await this.repository.findAll();
    return members
      .filter((m) => !!m.jiraId)
      .map((m) => ({
        id: m.jiraId!,
        name: m.name,
        team: m.teams.join(', '),
      }));
  }

  private entityToDto(entity: MemberEntity): MemberResponse {
    return {
      id: entity.id!,
      jiraId: entity.jiraId ?? null,
      name: entity.name,
      fullName: entity.fullName,
      email: entity.email,
      level: entity.level,
      teams: entity.teams,
      isLead: entity.isLead ?? false,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}

export const membersService = new MembersService(membersRepository);
