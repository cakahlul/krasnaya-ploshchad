import { db } from '@server/lib/db';
import { members } from '@server/db/schema';
import { eq } from 'drizzle-orm';
import type { MemberEntity } from '@shared/types/member.types';
import { Level } from '@shared/types/common.types';

type Row = typeof members.$inferSelect;

function rowToEntity(row: Row): MemberEntity {
  return {
    id: row.id,
    jiraId: row.jiraId,
    name: row.name,
    fullName: row.fullName,
    email: row.email,
    level: row.level as Level,
    isLead: row.isLead,
    teams: row.teams ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function entityToInsert(data: Omit<MemberEntity, 'id'>) {
  return {
    jiraId: data.jiraId ?? null,
    name: data.name,
    fullName: data.fullName,
    email: data.email,
    level: data.level,
    isLead: data.isLead ?? false,
    teams: data.teams ?? [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export class MembersRepository {
  async create(data: MemberEntity): Promise<MemberEntity> {
    const [row] = await db.insert(members).values(entityToInsert(data)).returning();
    return rowToEntity(row);
  }

  async findAll(): Promise<MemberEntity[]> {
    const rows = await db.select().from(members).orderBy(members.name);
    return rows.map(rowToEntity);
  }

  async findById(id: string): Promise<MemberEntity | null> {
    const [row] = await db.select().from(members).where(eq(members.id, id));
    return row ? rowToEntity(row) : null;
  }

  async findByJiraId(jiraId: string): Promise<MemberEntity | null> {
    const [row] = await db.select().from(members).where(eq(members.jiraId, jiraId));
    return row ? rowToEntity(row) : null;
  }

  async findByEmail(email: string): Promise<MemberEntity | null> {
    const [row] = await db.select().from(members).where(eq(members.email, email));
    return row ? rowToEntity(row) : null;
  }

  async update(id: string, data: Partial<MemberEntity>): Promise<MemberEntity | null> {
    const patch: Partial<typeof members.$inferInsert> = {};
    if (data.jiraId !== undefined) patch.jiraId = data.jiraId;
    if (data.name !== undefined) patch.name = data.name;
    if (data.fullName !== undefined) patch.fullName = data.fullName;
    if (data.email !== undefined) patch.email = data.email;
    if (data.level !== undefined) patch.level = data.level;
    if (data.isLead !== undefined) patch.isLead = data.isLead;
    if (data.teams !== undefined) patch.teams = data.teams;
    patch.updatedAt = data.updatedAt ?? new Date();

    const [row] = await db.update(members).set(patch).where(eq(members.id, id)).returning();
    return row ? rowToEntity(row) : null;
  }

  async delete(id: string): Promise<void> {
    await db.delete(members).where(eq(members.id, id));
  }
}

export const membersRepository = new MembersRepository();
