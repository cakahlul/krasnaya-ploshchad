import { db } from '@server/lib/db';
import { apiKeys } from '@server/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import type { ApiKeyEntity } from '@shared/types/api-key.types';

type Row = typeof apiKeys.$inferSelect;

function rowToEntity(row: Row): ApiKeyEntity {
  return {
    id: row.id,
    name: row.name,
    hashedKey: row.hashedKey,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
    isActive: row.isActive,
  };
}

export class ApiKeysRepository {
  async create(data: Omit<ApiKeyEntity, 'id'>): Promise<ApiKeyEntity> {
    const [row] = await db
      .insert(apiKeys)
      .values({
        name: data.name,
        hashedKey: data.hashedKey,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        lastUsedAt: data.lastUsedAt,
        isActive: data.isActive,
      })
      .returning();
    return rowToEntity(row);
  }

  async findAll(): Promise<ApiKeyEntity[]> {
    const rows = await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
    return rows.map(rowToEntity);
  }

  async findById(id: string): Promise<ApiKeyEntity | null> {
    const [row] = await db.select().from(apiKeys).where(eq(apiKeys.id, id));
    return row ? rowToEntity(row) : null;
  }

  async findByEmail(email: string): Promise<ApiKeyEntity[]> {
    const rows = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.createdBy, email))
      .orderBy(desc(apiKeys.createdAt));
    return rows.map(rowToEntity);
  }

  async findByHashedKey(hashedKey: string): Promise<ApiKeyEntity | null> {
    const [row] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.hashedKey, hashedKey), eq(apiKeys.isActive, true)));
    return row ? rowToEntity(row) : null;
  }

  async update(id: string, data: Partial<ApiKeyEntity>): Promise<void> {
    const patch: Partial<typeof apiKeys.$inferInsert> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.hashedKey !== undefined) patch.hashedKey = data.hashedKey;
    if (data.createdBy !== undefined) patch.createdBy = data.createdBy;
    if (data.lastUsedAt !== undefined) patch.lastUsedAt = data.lastUsedAt;
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    if (Object.keys(patch).length === 0) return;
    await db.update(apiKeys).set(patch).where(eq(apiKeys.id, id));
  }

  async delete(id: string): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }
}

export const apiKeysRepository = new ApiKeysRepository();
