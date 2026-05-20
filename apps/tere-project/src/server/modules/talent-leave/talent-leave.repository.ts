import { db } from '@server/lib/db';
import { talentLeave } from '@server/db/schema';
import { eq, and, type SQL } from 'drizzle-orm';

export interface TalentLeaveEntity {
  id?: string;
  memberId: string;
  name: string;
  team: string;
  leaveDate: Array<{ dateFrom: Date; dateTo: Date; status: 'Draft' | 'Confirmed' | 'Sick' }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveFilterDto {
  startDate?: string;
  endDate?: string;
  status?: string;
  team?: string;
}

type Row = typeof talentLeave.$inferSelect;
type StoredLeave = { dateFrom: string; dateTo: string; status: 'Draft' | 'Confirmed' | 'Sick' };

function leaveArrayToStored(arr: TalentLeaveEntity['leaveDate']): StoredLeave[] {
  return arr.map((l) => ({
    dateFrom: l.dateFrom.toISOString(),
    dateTo: l.dateTo.toISOString(),
    status: l.status,
  }));
}

function rowToEntity(row: Row): TalentLeaveEntity {
  const stored = (row.leaveDate ?? []) as StoredLeave[];
  return {
    id: row.id,
    memberId: row.memberId,
    name: row.name,
    team: row.team,
    leaveDate: stored.map((l) => ({
      dateFrom: new Date(l.dateFrom),
      dateTo: new Date(l.dateTo),
      status: l.status,
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class TalentLeaveRepository {
  async create(data: TalentLeaveEntity): Promise<TalentLeaveEntity> {
    const [row] = await db
      .insert(talentLeave)
      .values({
        memberId: data.memberId,
        name: data.name,
        team: data.team,
        leaveDate: leaveArrayToStored(data.leaveDate),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
      .returning();
    return rowToEntity(row);
  }

  async findByMemberId(memberId: string): Promise<TalentLeaveEntity | null> {
    const [row] = await db.select().from(talentLeave).where(eq(talentLeave.memberId, memberId));
    return row ? rowToEntity(row) : null;
  }

  async findById(id: string): Promise<TalentLeaveEntity | null> {
    const [row] = await db.select().from(talentLeave).where(eq(talentLeave.id, id));
    return row ? rowToEntity(row) : null;
  }

  async findByName(name: string): Promise<TalentLeaveEntity | null> {
    const [row] = await db.select().from(talentLeave).where(eq(talentLeave.name, name));
    return row ? rowToEntity(row) : null;
  }

  async findAll(filters?: LeaveFilterDto): Promise<TalentLeaveEntity[]> {
    const conds: SQL[] = [];
    if (filters?.team) conds.push(eq(talentLeave.team, filters.team));
    const rows = await db
      .select()
      .from(talentLeave)
      .where(conds.length ? and(...conds) : undefined);

    const shouldFilterDates = !!(filters && (filters.startDate || filters.endDate));
    const filterStart = shouldFilterDates && filters!.startDate ? new Date(filters!.startDate) : null;
    const filterEnd = shouldFilterDates && filters!.endDate ? new Date(filters!.endDate) : null;

    const results = rows.map((row) => {
      const entity = rowToEntity(row);
      if (!shouldFilterDates && !filters?.status) return entity;
      entity.leaveDate = entity.leaveDate.filter((leave) => {
        let dateMatch = true;
        if (shouldFilterDates) {
          if (filterStart && filterEnd) dateMatch = leave.dateFrom <= filterEnd && leave.dateTo >= filterStart;
          else if (filterStart) dateMatch = leave.dateTo >= filterStart;
          else if (filterEnd) dateMatch = leave.dateFrom <= filterEnd;
        }
        const statusMatch = filters?.status ? leave.status === filters.status : true;
        return dateMatch && statusMatch;
      });
      return entity;
    });

    results.sort((a, b) => {
      const aFirst = a.leaveDate[0]?.dateFrom.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bFirst = b.leaveDate[0]?.dateFrom.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aFirst - bFirst;
    });

    return results;
  }

  async update(id: string, data: Partial<TalentLeaveEntity>): Promise<TalentLeaveEntity | null> {
    const patch: Partial<typeof talentLeave.$inferInsert> = {};
    if (data.memberId !== undefined) patch.memberId = data.memberId;
    if (data.name !== undefined) patch.name = data.name;
    if (data.team !== undefined) patch.team = data.team;
    if (data.leaveDate !== undefined) patch.leaveDate = leaveArrayToStored(data.leaveDate);
    patch.updatedAt = data.updatedAt ?? new Date();

    const [row] = await db.update(talentLeave).set(patch).where(eq(talentLeave.id, id)).returning();
    return row ? rowToEntity(row) : null;
  }

  async delete(id: string): Promise<void> {
    await db.delete(talentLeave).where(eq(talentLeave.id, id));
  }
}

export const talentLeaveRepository = new TalentLeaveRepository();
