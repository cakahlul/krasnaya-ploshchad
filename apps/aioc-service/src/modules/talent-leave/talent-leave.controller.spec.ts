import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TalentLeaveController } from './talent-leave.controller';
import { TalentLeaveService } from './talent-leave.service';
import {
  CreateTalentLeaveDto,
  UpdateTalentLeaveDto,
  TalentLeaveResponseDto,
} from './interfaces/talent-leave.dto';

describe('TalentLeaveController', () => {
  let controller: TalentLeaveController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    isValidTimestamp: jest.fn(),
    validateDateRange: jest.fn(),
  };

  const mockLeaveResponse: TalentLeaveResponseDto = {
    id: 'test-id-123',
    name: 'John Doe',
    team: 'Engineering',
    dateFrom: '2024-12-25T00:00:00Z',
    dateTo: '2024-12-27T23:59:59Z',
    status: 'approved',
    role: 'BE',
    createdAt: '2024-11-10T10:00:00Z',
    updatedAt: '2024-11-10T10:00:00Z',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TalentLeaveController],
      providers: [
        {
          provide: TalentLeaveService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TalentLeaveController>(TalentLeaveController);
  });

  describe('POST /talent-leave', () => {
    it('should create leave record with valid data and return 201', async () => {
      const createDto: CreateTalentLeaveDto = {
        name: 'John Doe',
        team: 'Engineering',
        dateFrom: '2024-12-25T00:00:00Z',
        dateTo: '2024-12-27T23:59:59Z',
        status: 'approved',
        role: 'BE',
      };

      mockService.isValidTimestamp.mockReturnValue(true);
      mockService.validateDateRange.mockReturnValue(true);
      mockService.create.mockResolvedValue(mockLeaveResponse);

      const result = await controller.create(createDto);

      expect(mockService.isValidTimestamp).toHaveBeenCalledWith(
        createDto.dateFrom,
      );
      expect(mockService.isValidTimestamp).toHaveBeenCalledWith(
        createDto.dateTo,
      );
      expect(mockService.validateDateRange).toHaveBeenCalledWith(
        createDto.dateFrom,
        createDto.dateTo,
      );
      expect(mockService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockLeaveResponse);
    });

    it('should return 400 when missing required field (name)', async () => {
      const createDto = {
        team: 'Engineering',
        dateFrom: '2024-12-25T00:00:00Z',
        dateTo: '2024-12-27T23:59:59Z',
        status: 'approved',
      } as CreateTalentLeaveDto;

      await expect(controller.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(createDto)).rejects.toThrow(
        'name is required',
      );
    });

    it('should return 400 when missing required field (team)', async () => {
      const createDto = {
        name: 'John Doe',
        dateFrom: '2024-12-25T00:00:00Z',
        dateTo: '2024-12-27T23:59:59Z',
        status: 'approved',
      } as CreateTalentLeaveDto;

      await expect(controller.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(createDto)).rejects.toThrow(
        'team is required',
      );
    });

    it('should return 400 with invalid timestamp format', async () => {
      const createDto: CreateTalentLeaveDto = {
        name: 'John Doe',
        team: 'Engineering',
        dateFrom: 'invalid-date',
        dateTo: '2024-12-27T23:59:59Z',
        status: 'approved',
      };

      mockService.isValidTimestamp
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      await expect(controller.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockService.isValidTimestamp).toHaveBeenCalledWith('invalid-date');
    });

    it('should return 400 when dateTo < dateFrom', async () => {
      const createDto: CreateTalentLeaveDto = {
        name: 'John Doe',
        team: 'Engineering',
        dateFrom: '2024-12-27T00:00:00Z',
        dateTo: '2024-12-25T00:00:00Z',
        status: 'approved',
      };

      mockService.isValidTimestamp.mockReturnValue(true);
      mockService.validateDateRange.mockReturnValue(false);

      await expect(controller.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(createDto)).rejects.toThrow(
        'dateTo must be greater than or equal to dateFrom',
      );
    });
  });

  describe('GET /talent-leave', () => {
    it('should return 200 with array of records', async () => {
      const mockRecords: TalentLeaveResponseDto[] = [mockLeaveResponse];
      mockService.findAll.mockResolvedValue(mockRecords);

      const result = await controller.findAll();

      expect(mockService.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockRecords);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        startDate: '2024-12-20T00:00:00Z',
        endDate: '2025-01-05T23:59:59Z',
        status: 'approved',
        team: 'Engineering',
      };

      mockService.findAll.mockResolvedValue([mockLeaveResponse]);

      const result = await controller.findAll(
        filters.startDate,
        filters.endDate,
        filters.status,
        filters.team,
      );

      expect(mockService.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual([mockLeaveResponse]);
    });
  });

  describe('GET /talent-leave/:id', () => {
    it('should return 200 with single record', async () => {
      mockService.findOne.mockResolvedValue(mockLeaveResponse);

      const result = await controller.findOne('test-id-123');

      expect(mockService.findOne).toHaveBeenCalledWith('test-id-123');
      expect(result).toEqual(mockLeaveResponse);
    });

    it('should return 404 for non-existent ID', async () => {
      mockService.findOne.mockRejectedValue(
        new NotFoundException("Leave record with ID 'non-existent' not found"),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('PUT /talent-leave/:id', () => {
    it('should update with valid data and return 200', async () => {
      const updateDto: UpdateTalentLeaveDto = {
        status: 'cancelled',
      };

      const updatedResponse: TalentLeaveResponseDto = {
        ...mockLeaveResponse,
        status: 'cancelled',
        updatedAt: '2024-11-11T10:00:00Z',
      };

      mockService.update.mockResolvedValue(updatedResponse);

      const result = await controller.update('test-id-123', updateDto);

      expect(mockService.update).toHaveBeenCalledWith('test-id-123', updateDto);
      expect(result).toEqual(updatedResponse);
    });

    it('should validate timestamps when updating dates', async () => {
      const updateDto: UpdateTalentLeaveDto = {
        dateFrom: '2024-12-26T00:00:00Z',
        dateTo: '2024-12-28T00:00:00Z',
      };

      mockService.isValidTimestamp.mockReturnValue(true);
      mockService.validateDateRange.mockReturnValue(true);
      mockService.update.mockResolvedValue(mockLeaveResponse);

      await controller.update('test-id-123', updateDto);

      expect(mockService.isValidTimestamp).toHaveBeenCalledWith(
        updateDto.dateFrom,
      );
      expect(mockService.isValidTimestamp).toHaveBeenCalledWith(
        updateDto.dateTo,
      );
      expect(mockService.validateDateRange).toHaveBeenCalledWith(
        updateDto.dateFrom,
        updateDto.dateTo,
      );
    });

    it('should return 404 for invalid ID', async () => {
      const updateDto: UpdateTalentLeaveDto = {
        status: 'cancelled',
      };

      mockService.update.mockRejectedValue(
        new NotFoundException("Leave record with ID 'invalid-id' not found"),
      );

      await expect(controller.update('invalid-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('DELETE /talent-leave/:id', () => {
    it('should return 204 No Content', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove('test-id-123');

      expect(mockService.remove).toHaveBeenCalledWith('test-id-123');
    });

    it('should return 404 for invalid ID', async () => {
      mockService.remove.mockRejectedValue(
        new NotFoundException("Leave record with ID 'invalid-id' not found"),
      );

      await expect(controller.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
