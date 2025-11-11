import {
  CreateTalentLeaveDto,
  UpdateTalentLeaveDto,
  TalentLeaveResponseDto,
  LeaveFilterDto,
} from './talent-leave.dto';
import { TalentLeaveEntity } from './talent-leave.entity';

describe('TalentLeave DTOs and Entities', () => {
  describe('CreateTalentLeaveDto', () => {
    it('should have all mandatory fields defined', () => {
      const createDto: CreateTalentLeaveDto = {
        name: 'John Doe',
        team: 'Engineering',
        leaveDate: [
          {
            dateFrom: '2024-12-25T00:00:00Z',
            dateTo: '2024-12-27T23:59:59Z',
            status: 'Confirmed',
          },
        ],
        role: 'BE',
      };

      expect(createDto.name).toBeDefined();
      expect(createDto.team).toBeDefined();
      expect(createDto.leaveDate).toBeDefined();
      expect(createDto.leaveDate.length).toBeGreaterThan(0);
      expect(createDto.leaveDate[0].status).toBeDefined();
      expect(createDto.role).toBeDefined();
    });

    it('should accept string values for date fields and status in leaveDate array', () => {
      const createDto: CreateTalentLeaveDto = {
        name: 'John Doe',
        team: 'Engineering',
        leaveDate: [
          {
            dateFrom: '2024-12-25T00:00:00Z',
            dateTo: '2024-12-27T23:59:59Z',
            status: 'Draft',
          },
        ],
        role: 'BE',
      };

      expect(typeof createDto.leaveDate[0].dateFrom).toBe('string');
      expect(typeof createDto.leaveDate[0].dateTo).toBe('string');
      expect(typeof createDto.leaveDate[0].status).toBe('string');
    });

    it('should support multiple leave date ranges with different statuses', () => {
      const createDto: CreateTalentLeaveDto = {
        name: 'John Doe',
        team: 'Engineering',
        leaveDate: [
          {
            dateFrom: '2024-12-25T00:00:00Z',
            dateTo: '2024-12-27T23:59:59Z',
            status: 'Confirmed',
          },
          {
            dateFrom: '2025-01-10T00:00:00Z',
            dateTo: '2025-01-15T23:59:59Z',
            status: 'Draft',
          },
        ],
        role: 'BE',
      };

      expect(createDto.leaveDate.length).toBe(2);
      expect(createDto.leaveDate[0].dateFrom).toBe('2024-12-25T00:00:00Z');
      expect(createDto.leaveDate[0].status).toBe('Confirmed');
      expect(createDto.leaveDate[1].dateFrom).toBe('2025-01-10T00:00:00Z');
      expect(createDto.leaveDate[1].status).toBe('Draft');
    });
  });

  describe('UpdateTalentLeaveDto', () => {
    it('should allow all fields to be optional', () => {
      const updateDto: UpdateTalentLeaveDto = {};
      expect(updateDto).toBeDefined();
    });

    it('should allow partial updates with only some fields', () => {
      const updateDto: UpdateTalentLeaveDto = {
        name: 'Jane Doe',
      };

      expect(updateDto.name).toBe('Jane Doe');
      expect(updateDto.team).toBeUndefined();
      expect(updateDto.leaveDate).toBeUndefined();
    });

    it('should accept leaveDate array with status when provided', () => {
      const updateDto: UpdateTalentLeaveDto = {
        leaveDate: [
          {
            dateFrom: '2024-12-26T00:00:00Z',
            dateTo: '2024-12-28T23:59:59Z',
            status: 'Confirmed',
          },
        ],
      };

      expect(updateDto.leaveDate).toBeDefined();
      expect(updateDto.leaveDate?.[0].dateFrom).toBe('2024-12-26T00:00:00Z');
      expect(updateDto.leaveDate?.[0].status).toBe('Confirmed');
    });
  });

  describe('TalentLeaveResponseDto', () => {
    it('should include id and all timestamp fields', () => {
      const responseDto: TalentLeaveResponseDto = {
        id: 'test-id-123',
        name: 'John Doe',
        team: 'Engineering',
        leaveDate: [
          {
            dateFrom: '2024-12-25T00:00:00Z',
            dateTo: '2024-12-27T23:59:59Z',
            status: 'Confirmed',
          },
        ],
        role: 'BE',
        createdAt: '2024-11-10T10:00:00Z',
        updatedAt: '2024-11-10T10:00:00Z',
      };

      expect(responseDto.id).toBeDefined();
      expect(responseDto.createdAt).toBeDefined();
      expect(responseDto.updatedAt).toBeDefined();
    });

    it('should use string ISO 8601 format for timestamps and status per leave range', () => {
      const responseDto: TalentLeaveResponseDto = {
        id: 'test-id-123',
        name: 'John Doe',
        team: 'Engineering',
        leaveDate: [
          {
            dateFrom: '2024-12-25T00:00:00Z',
            dateTo: '2024-12-27T23:59:59Z',
            status: 'Confirmed',
          },
        ],
        role: 'BE',
        createdAt: '2024-11-10T10:00:00Z',
        updatedAt: '2024-11-10T10:00:00Z',
      };

      expect(typeof responseDto.leaveDate[0].dateFrom).toBe('string');
      expect(typeof responseDto.leaveDate[0].dateTo).toBe('string');
      expect(typeof responseDto.leaveDate[0].status).toBe('string');
      expect(typeof responseDto.createdAt).toBe('string');
      expect(typeof responseDto.updatedAt).toBe('string');
    });
  });

  describe('LeaveFilterDto', () => {
    it('should accept optional filter parameters', () => {
      const filterDto: LeaveFilterDto = {};
      expect(filterDto).toBeDefined();
    });

    it('should allow filtering by date range', () => {
      const filterDto: LeaveFilterDto = {
        startDate: '2024-12-20T00:00:00Z',
        endDate: '2025-01-05T23:59:59Z',
      };

      expect(filterDto.startDate).toBeDefined();
      expect(filterDto.endDate).toBeDefined();
    });

    it('should allow filtering by status', () => {
      const filterDto: LeaveFilterDto = {
        status: 'approved',
      };

      expect(filterDto.status).toBe('approved');
    });

    it('should allow filtering by team', () => {
      const filterDto: LeaveFilterDto = {
        team: 'Engineering',
      };

      expect(filterDto.team).toBe('Engineering');
    });

    it('should allow combined filters', () => {
      const filterDto: LeaveFilterDto = {
        startDate: '2024-12-20T00:00:00Z',
        endDate: '2025-01-05T23:59:59Z',
        status: 'approved',
        team: 'Engineering',
      };

      expect(filterDto.startDate).toBeDefined();
      expect(filterDto.endDate).toBeDefined();
      expect(filterDto.status).toBeDefined();
      expect(filterDto.team).toBeDefined();
    });
  });

  describe('TalentLeaveEntity', () => {
    it('should use Date objects for timestamps and include status per leave range', () => {
      const entity: TalentLeaveEntity = {
        id: 'test-id-123',
        name: 'John Doe',
        team: 'Engineering',
        leaveDate: [
          {
            dateFrom: new Date('2024-12-25T00:00:00Z'),
            dateTo: new Date('2024-12-27T23:59:59Z'),
            status: 'Confirmed',
          },
        ],
        role: 'BE',
        createdAt: new Date('2024-11-10T10:00:00Z'),
        updatedAt: new Date('2024-11-10T10:00:00Z'),
      };

      expect(entity.leaveDate[0].dateFrom instanceof Date).toBe(true);
      expect(entity.leaveDate[0].dateTo instanceof Date).toBe(true);
      expect(entity.leaveDate[0].status).toBe('Confirmed');
      expect(entity.createdAt instanceof Date).toBe(true);
      expect(entity.updatedAt instanceof Date).toBe(true);
    });

    it('should allow id to be optional for creation', () => {
      const entity: TalentLeaveEntity = {
        name: 'John Doe',
        team: 'Engineering',
        leaveDate: [
          {
            dateFrom: new Date('2024-12-25T00:00:00Z'),
            dateTo: new Date('2024-12-27T23:59:59Z'),
            status: 'Draft',
          },
        ],
        role: 'BE',
        createdAt: new Date('2024-11-10T10:00:00Z'),
        updatedAt: new Date('2024-11-10T10:00:00Z'),
      };

      expect(entity.id).toBeUndefined();
      expect(entity.name).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should enforce type constraints at compile time', () => {
      // This test validates TypeScript type checking
      // If this compiles, type constraints are working

      const createDto: CreateTalentLeaveDto = {
        name: 'John Doe',
        team: 'Engineering',
        leaveDate: [
          {
            dateFrom: '2024-12-25T00:00:00Z',
            dateTo: '2024-12-27T23:59:59Z',
            status: 'Confirmed',
          },
        ],
        role: 'BE',
      };

      const entity: TalentLeaveEntity = {
        name: createDto.name,
        team: createDto.team,
        leaveDate: createDto.leaveDate.map((leave) => ({
          dateFrom: new Date(leave.dateFrom),
          dateTo: new Date(leave.dateTo),
          status: leave.status,
        })),
        role: createDto.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const responseDto: TalentLeaveResponseDto = {
        id: 'test-id',
        name: entity.name,
        team: entity.team,
        leaveDate: entity.leaveDate.map((leave) => ({
          dateFrom: leave.dateFrom.toISOString(),
          dateTo: leave.dateTo.toISOString(),
          status: leave.status,
        })),
        role: entity.role,
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString(),
      };

      expect(responseDto).toBeDefined();
    });
  });
});
