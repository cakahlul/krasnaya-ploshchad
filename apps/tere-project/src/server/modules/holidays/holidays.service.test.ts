import assert from 'node:assert/strict';
import { HolidaysError, HolidaysService } from './holidays.service';
import type { Holiday, HolidayAuditEntry } from './holidays.repository';

const existing: Holiday = {
  id: '77f8489c-5dd1-4455-8a1c-d5a7cd318dca',
  holiday_date: '2026-07-14',
  holiday_name: 'Test Holiday',
  is_national_holiday: true,
};

function makeRepo(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    fetchHolidaysByYear: async () => [existing],
    fetchHolidaysForYears: async () => [existing],
    fetchAuditLog: async () => [],
    findById: async () => null,
    createWithAudit: async () => existing,
    createManyWithAudit: async () => [existing],
    deleteFutureWithAudit: async () => null,
    ...overrides,
  } as unknown as ConstructorParameters<typeof HolidaysService>[0];
}

async function main() {
  // createHoliday delegates to createWithAudit with changedBy
  {
    let received: unknown;
    const service = new HolidaysService(
      makeRepo({
        createWithAudit: async (date: string, name: string, changedBy: string) => {
          received = { date, name, changedBy };
          return existing;
        },
      }),
    );
    const result = await service.createHoliday('2026-07-14', 'Test Holiday', 'lead@amarbank.co.id');
    assert.deepEqual(result, existing);
    assert.deepEqual(received, {
      date: '2026-07-14',
      name: 'Test Holiday',
      changedBy: 'lead@amarbank.co.id',
    });
  }

  // createHoliday rejects empty date/name (validation at trust boundary)
  {
    const service = new HolidaysService(makeRepo());
    await assert.rejects(
      service.createHoliday('', 'Test Holiday', 'lead@amarbank.co.id'),
      (error: unknown) => error instanceof HolidaysError && error.code === 'VALIDATION_ERROR' && error.status === 400,
    );
    await assert.rejects(
      service.createHoliday('2026-07-14', '', 'lead@amarbank.co.id'),
      (error: unknown) => error instanceof HolidaysError && error.code === 'VALIDATION_ERROR' && error.status === 400,
    );
  }

  // bulkCreateHolidays delegates to createManyWithAudit with changedBy
  {
    let received: unknown;
    const items = [
      { date: '2026-07-14', name: 'A' },
      { date: '2026-07-15', name: 'B' },
    ];
    const service = new HolidaysService(
      makeRepo({
        createManyWithAudit: async (passedItems: unknown, changedBy: string) => {
          received = { passedItems, changedBy };
          return [existing, existing];
        },
      }),
    );
    const result = await service.bulkCreateHolidays(items, 'lead@amarbank.co.id');
    assert.deepEqual(result, { count: 2 });
    assert.deepEqual(received, { passedItems: items, changedBy: 'lead@amarbank.co.id' });
  }

  // bulkCreateHolidays rejects empty array
  {
    const service = new HolidaysService(makeRepo());
    await assert.rejects(
      service.bulkCreateHolidays([], 'lead@amarbank.co.id'),
      (error: unknown) => error instanceof HolidaysError && error.code === 'VALIDATION_ERROR',
    );
  }

  // deleteHoliday success path delegates to deleteFutureWithAudit
  {
    let received: unknown;
    const service = new HolidaysService(
      makeRepo({
        deleteFutureWithAudit: async (id: string, changedBy: string) => {
          received = { id, changedBy };
          return existing;
        },
      }),
    );
    await service.deleteHoliday(existing.id!, 'lead@amarbank.co.id');
    assert.deepEqual(received, { id: existing.id, changedBy: 'lead@amarbank.co.id' });
  }

  // deleteHoliday: not found (deleteFutureWithAudit null, findById null) -> HOLIDAY_NOT_FOUND 404
  {
    const service = new HolidaysService(
      makeRepo({
        deleteFutureWithAudit: async () => null,
        findById: async () => null,
      }),
    );
    await assert.rejects(
      service.deleteHoliday(existing.id!, 'lead@amarbank.co.id'),
      (error: unknown) => error instanceof HolidaysError && error.code === 'HOLIDAY_NOT_FOUND' && error.status === 404,
    );
  }

  // deleteHoliday: exists but not future (deleteFutureWithAudit null, findById found) -> IMMUTABLE_CONFIG 409
  {
    const service = new HolidaysService(
      makeRepo({
        deleteFutureWithAudit: async () => null,
        findById: async () => existing,
      }),
    );
    await assert.rejects(
      service.deleteHoliday(existing.id!, 'lead@amarbank.co.id'),
      (error: unknown) => error instanceof HolidaysError && error.code === 'IMMUTABLE_CONFIG' && error.status === 409,
    );
  }

  // fetchAuditLog delegates to repo, paginates, invalid cursor -> VALIDATION_ERROR 400
  {
    const auditRows: HolidayAuditEntry[] = Array.from({ length: 21 }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(20 - index).padStart(12, '0')}`,
      entity_id: existing.id!,
      action: index % 2 === 0 ? 'create' : 'delete',
      changed_by: 'lead@amarbank.co.id',
      old_value: index % 2 === 0 ? null : existing,
      new_value: index % 2 === 0 ? existing : null,
      changed_at: '2026-07-14T01:02:03.123456Z',
    }));
    let receivedCursor: unknown = 'not-called';
    const service = new HolidaysService(
      makeRepo({
        fetchAuditLog: async (cursor: unknown) => {
          receivedCursor = cursor;
          return auditRows;
        },
      }),
    );
    const firstPage = await service.fetchAuditLog(null);
    assert.equal(receivedCursor, null);
    assert.deepEqual(firstPage.items, auditRows.slice(0, 20));
    assert.equal(typeof firstPage.next_cursor, 'string');

    await service.fetchAuditLog(firstPage.next_cursor);
    assert.deepEqual(receivedCursor, {
      changed_at: auditRows[19].changed_at,
      id: auditRows[19].id,
    });

    await assert.rejects(
      service.fetchAuditLog('not-a-valid-cursor$$$'),
      (error: unknown) =>
        error instanceof HolidaysError && error.code === 'VALIDATION_ERROR' && error.status === 400,
    );
  }

  console.log('holidays.service.test.ts OK');
}

main();
