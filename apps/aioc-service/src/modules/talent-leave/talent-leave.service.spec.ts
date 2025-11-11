import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TalentLeaveService } from './talent-leave.service';
import { TalentLeaveRepository } from './repositories/talent-leave.repository';
import { TalentLeaveEntity } from './interfaces/talent-leave.entity';
import {
  CreateTalentLeaveDto,
  UpdateTalentLeaveDto,
  LeaveFilterDto,
} from './interfaces/talent-leave.dto';

describe('TalentLeaveService', () => {
  let service: TalentLeaveService;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TalentLeaveService,
        {
          provide: TalentLeaveRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TalentLeaveService>(TalentLeaveService);
  });

  describe('create', () => {
    it('should transform CreateTalentLeaveDto to entity and return TalentLeaveResponseDto', async () => {
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

      mockRepository.create.mockResolvedValue(entity);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createDto.name,
          team: createDto.team,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          leaveDate: expect.arrayContaining([
            expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              dateFrom: expect.any(Date),
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              dateTo: expect.any(Date),
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              status: expect.any(String),
            }),
          ]),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          createdAt: expect.any(Date),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          updatedAt: expect.any(Date),
        }),
      );
      expect(result.id).toBe('test-id-123');
      expect(result.name).toBe('John Doe');
      expect(result.leaveDate.length).toBe(1);
      expect(typeof result.leaveDate[0].dateFrom).toBe('string');
      expect(typeof result.createdAt).toBe('string');
    });
  });

  describe('findAll', () => {
    it('should return all records as DTOs with no filters', async () => {
      const entities: TalentLeaveEntity[] = [
        {
          id: 'id-1',
          name: 'User 1',
          team: 'Engineering',
          dateFrom: new Date('2024-12-25T00:00:00Z'),
          dateTo: new Date('2024-12-27T23:59:59Z'),
          status: 'approved',
          createdAt: new Date('2024-11-10T10:00:00Z'),
          updatedAt: new Date('2024-11-10T10:00:00Z'),
        },
        {
          id: 'id-2',
          name: 'User 2',
          team: 'Marketing',
          dateFrom: new Date('2024-12-26T00:00:00Z'),
          dateTo: new Date('2024-12-28T23:59:59Z'),
          status: 'pending',
          createdAt: new Date('2024-11-10T11:00:00Z'),
          updatedAt: new Date('2024-11-10T11:00:00Z'),
        },
      ];

      mockRepository.findAll.mockResolvedValue(entities);

      const result = await service.findAll();

      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('id-1');
      expect(typeof result[0].dateFrom).toBe('string');
      expect(typeof result[0].createdAt).toBe('string');
    });

    it('should delegate filters correctly to repository', async () => {
      const filters: LeaveFilterDto = {
        startDate: '2024-12-20T00:00:00Z',
        endDate: '2025-01-05T23:59:59Z',
        status: 'approved',
        team: 'Engineering',
      };

      mockRepository.findAll.mockResolvedValue([]);

      await service.findAll(filters);

      expect(mockRepository.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('findOne', () => {
    it('should return DTO when record exists', async () => {
      const entity: TalentLeaveEntity = {
        id: 'test-id-123',
        name: 'John Doe',
        team: 'Engineering',
        dateFrom: new Date('2024-12-25T00:00:00Z'),
        dateTo: new Date('2024-12-27T23:59:59Z'),
        status: 'approved',
        createdAt: new Date('2024-11-10T10:00:00Z'),
        updatedAt: new Date('2024-11-10T10:00:00Z'),
      };

      mockRepository.findById.mockResolvedValue(entity);

      const result = await service.findOne('test-id-123');

      expect(mockRepository.findById).toHaveBeenCalledWith('test-id-123');
      expect(result.id).toBe('test-id-123');
      expect(result.name).toBe('John Doe');
      expect(typeof result.dateFrom).toBe('string');
    });

    it('should throw NotFoundException when record does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        "Leave record with ID 'non-existent-id' not found",
      );
    });
  });

  describe('update', () => {
    it('should transform UpdateTalentLeaveDto and return updated DTO', async () => {
      const updateDto: UpdateTalentLeaveDto = {
        status: 'cancelled',
      };

      const updatedEntity: TalentLeaveEntity = {
        id: 'test-id-123',
        name: 'John Doe',
        team: 'Engineering',
        dateFrom: new Date('2024-12-25T00:00:00Z'),
        dateTo: new Date('2024-12-27T23:59:59Z'),
        status: 'cancelled',
        createdAt: new Date('2024-11-10T10:00:00Z'),
        updatedAt: new Date('2024-11-11T10:00:00Z'),
      };

      mockRepository.update.mockResolvedValue(updatedEntity);

      const result = await service.update('test-id-123', updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(
        'test-id-123',
        expect.objectContaining({
          status: 'cancelled',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          updatedAt: expect.any(Date),
        }),
      );
      expect(result.id).toBe('test-id-123');
      expect(result.status).toBe('cancelled');
      expect(typeof result.updatedAt).toBe('string');
    });

    it('should throw NotFoundException when record does not exist', async () => {
      const updateDto: UpdateTalentLeaveDto = {
        status: 'cancelled',
      };

      mockRepository.update.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', updateDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('non-existent-id', updateDto),
      ).rejects.toThrow("Leave record with ID 'non-existent-id' not found");
    });
  });

  describe('remove', () => {
    it('should delegate delete to repository', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'test-id-123',
        name: 'John Doe',
      } as TalentLeaveEntity);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.remove('test-id-123');

      expect(mockRepository.findById).toHaveBeenCalledWith('test-id-123');
      expect(mockRepository.delete).toHaveBeenCalledWith('test-id-123');
    });

    it('should throw NotFoundException when record does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('non-existent-id')).rejects.toThrow(
        "Leave record with ID 'non-existent-id' not found",
      );
    });
  });

  describe('timestamp conversion', () => {
    it('should convert Date to ISO 8601 strings in DTOs', async () => {
      const entity: TalentLeaveEntity = {
        id: 'test-id-123',
        name: 'John Doe',
        team: 'Engineering',
        dateFrom: new Date('2024-12-25T00:00:00.000Z'),
        dateTo: new Date('2024-12-27T23:59:59.000Z'),
        status: 'approved',
        createdAt: new Date('2024-11-10T10:00:00.000Z'),
        updatedAt: new Date('2024-11-10T10:00:00.000Z'),
      };

      mockRepository.findById.mockResolvedValue(entity);

      const result = await service.findOne('test-id-123');

      expect(result.dateFrom).toBe('2024-12-25T00:00:00.000Z');
      expect(result.dateTo).toBe('2024-12-27T23:59:59.000Z');
      expect(result.createdAt).toBe('2024-11-10T10:00:00.000Z');
      expect(result.updatedAt).toBe('2024-11-10T10:00:00.000Z');
    });
  });

  describe('validation helpers', () => {
    describe('isValidTimestamp', () => {
      it('should return true for valid ISO 8601 strings', () => {
        expect(service.isValidTimestamp('2024-12-25T00:00:00Z')).toBe(true);
        expect(service.isValidTimestamp('2024-12-25T00:00:00.000Z')).toBe(true);
        expect(service.isValidTimestamp('2024-01-01T12:30:45Z')).toBe(true);
      });

      it('should return false for invalid date strings', () => {
        expect(service.isValidTimestamp('invalid-date')).toBe(false);
        expect(service.isValidTimestamp('2024-13-45')).toBe(false);
        expect(service.isValidTimestamp('not a date at all')).toBe(false);
      });

      it('should return false for empty or malformed strings', () => {
        expect(service.isValidTimestamp('')).toBe(false);
        expect(service.isValidTimestamp('  ')).toBe(false);
        expect(service.isValidTimestamp('abc-def-ghi')).toBe(false);
      });
    });

    describe('validateDateRange', () => {
      it('should return true when dateTo >= dateFrom', () => {
        expect(
          service.validateDateRange(
            '2024-12-25T00:00:00Z',
            '2024-12-27T00:00:00Z',
          ),
        ).toBe(true);
        expect(
          service.validateDateRange(
            '2024-01-01T00:00:00Z',
            '2024-12-31T23:59:59Z',
          ),
        ).toBe(true);
      });

      it('should return false when dateTo < dateFrom', () => {
        expect(
          service.validateDateRange(
            '2024-12-27T00:00:00Z',
            '2024-12-25T00:00:00Z',
          ),
        ).toBe(false);
        expect(
          service.validateDateRange(
            '2024-12-31T23:59:59Z',
            '2024-01-01T00:00:00Z',
          ),
        ).toBe(false);
      });

      it('should handle same date (dateFrom === dateTo)', () => {
        expect(
          service.validateDateRange(
            '2024-12-25T00:00:00Z',
            '2024-12-25T00:00:00Z',
          ),
        ).toBe(true);
        expect(
          service.validateDateRange(
            '2024-12-25T12:30:00Z',
            '2024-12-25T12:30:00Z',
          ),
        ).toBe(true);
      });
    });
  });
});
