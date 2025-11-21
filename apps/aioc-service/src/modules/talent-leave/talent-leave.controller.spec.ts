import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { TalentLeaveController } from './talent-leave.controller';
import { TalentLeaveService } from './talent-leave.service';
import {
  CreateTalentLeaveDto,
  UpdateTalentLeaveDto,
  TalentLeaveResponseDto,
} from './interfaces/talent-leave.dto';
import { TalentLeaveExportService } from './talent-leave-export.service';
import type {
  ExportTalentLeaveDto,
  ExportTalentLeaveResponseDto,
} from './interfaces/talent-leave-export.dto';

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
    findAllTeams: jest.fn(),
    findAllTalents: jest.fn(),
  };

  const mockExportService = {
    exportToSpreadsheet: jest.fn(),
  };

  const mockLeaveResponse: TalentLeaveResponseDto = {
    id: 'test-id-123',
    name: 'John Doe',
    team: 'Engineering',
    leaveDate: [
      {
        dateFrom: '2024-12-25T00:00:00Z',
        dateTo: '2024-12-27T23:59:59Z',
        status: 'approved',
      },
    ],
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
        {
          provide: TalentLeaveExportService,
          useValue: mockExportService,
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
        leaveDate: [
          {
            dateFrom: '2024-12-25T00:00:00Z',
            dateTo: '2024-12-27T23:59:59Z',
            status: 'approved',
          },
        ],
        role: 'BE',
      };

      mockService.isValidTimestamp.mockReturnValue(true);
      mockService.validateDateRange.mockReturnValue(true);
      mockService.create.mockResolvedValue(mockLeaveResponse);

      const result = await controller.create(createDto);

      expect(mockService.isValidTimestamp).toHaveBeenCalledWith(
        createDto.leaveDate![0].dateFrom,
      );
      expect(mockService.isValidTimestamp).toHaveBeenCalledWith(
        createDto.leaveDate![0].dateTo,
      );
      expect(mockService.validateDateRange).toHaveBeenCalledWith(
        createDto.leaveDate![0].dateFrom,
        createDto.leaveDate![0].dateTo,
      );
      expect(mockService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockLeaveResponse);
    });

    it('should return 400 when missing required field (name)', async () => {
      const createDto = {
        team: 'Engineering',
        role: 'BE',
        leaveDate: [],
      } as unknown as CreateTalentLeaveDto;

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
        role: 'BE',
        leaveDate: [],
      } as unknown as CreateTalentLeaveDto;

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
        role: 'BE',
        leaveDate: [
          {
            dateFrom: 'invalid-date',
            dateTo: '2024-12-27T23:59:59Z',
            status: 'approved',
          },
        ],
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
        role: 'BE',
        leaveDate: [
          {
            dateFrom: '2024-12-27T00:00:00Z',
            dateTo: '2024-12-25T00:00:00Z',
            status: 'approved',
          },
        ],
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
        name: 'Jane Doe',
      };

      const updatedResponse: TalentLeaveResponseDto = {
        ...mockLeaveResponse,
        name: 'Jane Doe',
        updatedAt: '2024-11-11T10:00:00Z',
      };

      mockService.update.mockResolvedValue(updatedResponse);

      const result = await controller.update('test-id-123', updateDto);

      expect(mockService.update).toHaveBeenCalledWith('test-id-123', updateDto);
      expect(result).toEqual(updatedResponse);
    });

    it('should validate timestamps when updating dates', async () => {
      const updateDto: UpdateTalentLeaveDto = {
        leaveDate: [
          {
            dateFrom: '2024-12-26T00:00:00Z',
            dateTo: '2024-12-28T00:00:00Z',
            status: 'approved',
          },
        ],
      };

      mockService.isValidTimestamp.mockReturnValue(true);
      mockService.validateDateRange.mockReturnValue(true);
      mockService.update.mockResolvedValue(mockLeaveResponse);

      await controller.update('test-id-123', updateDto);

      expect(mockService.isValidTimestamp).toHaveBeenCalledWith(
        updateDto.leaveDate![0].dateFrom,
      );
      expect(mockService.isValidTimestamp).toHaveBeenCalledWith(
        updateDto.leaveDate![0].dateTo,
      );
      expect(mockService.validateDateRange).toHaveBeenCalledWith(
        updateDto.leaveDate![0].dateFrom,
        updateDto.leaveDate![0].dateTo,
      );
    });

    it('should return 404 for invalid ID', async () => {
      const updateDto: UpdateTalentLeaveDto = {
        name: 'Jane Doe',
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

  describe('POST /talent-leave/export', () => {
    const validExportDto: ExportTalentLeaveDto = {
      startDate: '2025-01-13',
      endDate: '2025-02-09',
      ownerEmail: 'user@example.com',
    };

    const mockExportResponse: ExportTalentLeaveResponseDto = {
      success: true,
      message: 'Spreadsheet created and sent to user@example.com',
      spreadsheetTitle: 'Talent Leave - 13/01/2025 to 09/02/2025',
      dateRange: {
        startDate: '2025-01-13',
        endDate: '2025-02-09',
      },
      ownerEmail: 'user@example.com',
      exportedAt: '2025-01-15T10:00:00.000Z',
    };

    it('should return 200 with success response on valid request', async () => {
      mockExportService.exportToSpreadsheet.mockResolvedValue(
        mockExportResponse,
      );

      const result = await controller.exportToSpreadsheet(validExportDto);

      expect(mockExportService.exportToSpreadsheet).toHaveBeenCalledWith(
        validExportDto,
      );
      expect(result).toEqual(mockExportResponse);
    });

    it('should return 400 if startDate missing', async () => {
      const dto = {
        endDate: '2025-02-09',
        ownerEmail: 'user@example.com',
      } as ExportTalentLeaveDto;

      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        'startDate is required',
      );
    });

    it('should return 400 if endDate missing', async () => {
      const dto = {
        startDate: '2025-01-13',
        ownerEmail: 'user@example.com',
      } as ExportTalentLeaveDto;

      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        'endDate is required',
      );
    });

    it('should return 400 if ownerEmail missing', async () => {
      const dto = {
        startDate: '2025-01-13',
        endDate: '2025-02-09',
      } as ExportTalentLeaveDto;

      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        'ownerEmail is required',
      );
    });

    it('should return 400 if startDate invalid format', async () => {
      const dto: ExportTalentLeaveDto = {
        startDate: '01/13/2025',
        endDate: '2025-02-09',
        ownerEmail: 'user@example.com',
      };

      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        'startDate must be in YYYY-MM-DD format',
      );
    });

    it('should return 400 if endDate invalid format', async () => {
      const dto: ExportTalentLeaveDto = {
        startDate: '2025-01-13',
        endDate: '02/09/2025',
        ownerEmail: 'user@example.com',
      };

      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        'endDate must be in YYYY-MM-DD format',
      );
    });

    it('should return 400 if ownerEmail invalid format', async () => {
      const dto: ExportTalentLeaveDto = {
        startDate: '2025-01-13',
        endDate: '2025-02-09',
        ownerEmail: 'invalid-email',
      };

      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        'ownerEmail must be a valid email address',
      );
    });

    it('should return 400 if endDate < startDate', async () => {
      const dto: ExportTalentLeaveDto = {
        startDate: '2025-02-09',
        endDate: '2025-01-13',
        ownerEmail: 'user@example.com',
      };

      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        'endDate must be after or equal to startDate',
      );
    });

    it('should return 400 if range > 90 days', async () => {
      const dto: ExportTalentLeaveDto = {
        startDate: '2025-01-01',
        endDate: '2025-04-15',
        ownerEmail: 'user@example.com',
      };

      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.exportToSpreadsheet(dto)).rejects.toThrow(
        'date range cannot exceed 90 days',
      );
    });

    it('should call TalentLeaveExportService.exportToSpreadsheet', async () => {
      mockExportService.exportToSpreadsheet.mockResolvedValue(
        mockExportResponse,
      );

      await controller.exportToSpreadsheet(validExportDto);

      expect(mockExportService.exportToSpreadsheet).toHaveBeenCalledTimes(1);
      expect(mockExportService.exportToSpreadsheet).toHaveBeenCalledWith(
        validExportDto,
      );
    });

    it('should return 500 on service error', async () => {
      mockExportService.exportToSpreadsheet.mockRejectedValue(
        new InternalServerErrorException('Failed to create spreadsheet'),
      );

      await expect(
        controller.exportToSpreadsheet(validExportDto),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        controller.exportToSpreadsheet(validExportDto),
      ).rejects.toThrow('Failed to create spreadsheet');
    });
  });
});
