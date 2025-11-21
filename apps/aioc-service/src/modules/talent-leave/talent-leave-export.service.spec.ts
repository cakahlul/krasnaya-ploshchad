/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { TalentLeaveExportService } from './talent-leave-export.service';
import { TalentLeaveRepository } from './repositories/talent-leave.repository';
import { GoogleSheetsClient } from './clients/google-sheets.client';

describe('TalentLeaveExportService', () => {
  let service: TalentLeaveExportService;
  let repository: TalentLeaveRepository;
  let googleSheetsClient: GoogleSheetsClient;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TalentLeaveExportService,
        {
          provide: TalentLeaveRepository,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: GoogleSheetsClient,
          useValue: {
            createSpreadsheet: jest.fn(),
            transferOwnership: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TalentLeaveExportService>(TalentLeaveExportService);
    repository = module.get<TalentLeaveRepository>(TalentLeaveRepository);
    googleSheetsClient = module.get<GoogleSheetsClient>(GoogleSheetsClient);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('validateDateRange', () => {
    it('should throw BadRequestException if endDate < startDate', async () => {
      const dto = {
        startDate: '2025-01-31',
        endDate: '2025-01-01',
        ownerEmail: 'test@example.com',
      };

      await expect(service.exportToSpreadsheet(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.exportToSpreadsheet(dto)).rejects.toThrow(
        'endDate must be >= startDate',
      );
    });

    it('should throw BadRequestException if range > 90 days', async () => {
      const dto = {
        startDate: '2025-01-01',
        endDate: '2025-04-10', // 99 days
        ownerEmail: 'test@example.com',
      };

      await expect(service.exportToSpreadsheet(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.exportToSpreadsheet(dto)).rejects.toThrow(
        'Date range must not exceed 90 days',
      );
    });

    it('should pass for valid range', async () => {
      const dto = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        accessToken: 'mock-access-token',
      };

      jest.spyOn(repository, 'findAll').mockResolvedValue([]);
      jest.spyOn(httpService, 'get').mockReturnValue(of({ data: [] } as any));
      jest.spyOn(googleSheetsClient, 'createSpreadsheet').mockResolvedValue({
        spreadsheetId: 'test-id',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/test-id',
      });

      await expect(service.exportToSpreadsheet(dto)).resolves.toBeDefined();
    });
  });

  describe('exportToSpreadsheet', () => {
    const validDto = {
      startDate: '2025-01-13',
      endDate: '2025-01-17',
      accessToken: 'mock-access-token',
    };

    const mockLeaveRecords: any = [
      {
        id: '1',
        name: 'Alice',
        team: 'Engineering',
        role: 'BE',
        leaveDate: [
          {
            dateFrom: '2025-01-13',
            dateTo: '2025-01-15',
            status: 'Confirmed',
          },
        ],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    const mockHolidays = [
      {
        holiday_date: '2025-01-14',
        holiday_name: 'Test Holiday',
        is_national_holiday: true,
      },
    ];

    beforeEach(() => {
      jest.spyOn(repository, 'findAll').mockResolvedValue(mockLeaveRecords);
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: mockHolidays } as any));
      jest.spyOn(googleSheetsClient, 'createSpreadsheet').mockResolvedValue({
        spreadsheetId: 'test-spreadsheet-id',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/test-id',
      });
    });

    it('should fetch leave data using repository', async () => {
      await service.exportToSpreadsheet(validDto);

      expect(repository.findAll).toHaveBeenCalledWith({
        startDate: '2025-01-13',
        endDate: '2025-01-17',
      });
    });

    it('should fetch holidays from api-harilibur.vercel.app using HTTP service', async () => {
      await service.exportToSpreadsheet(validDto);

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api-harilibur.vercel.app/api?year=2025&month=1',
      );
    });

    it('should continue without holidays if API fails (graceful degradation)', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => new Error('API Error')));

      const result = await service.exportToSpreadsheet(validDto);

      expect(result.success).toBe(true);
    });

    it('should fetch holidays for multiple months if date range spans months', async () => {
      const crossMonthDto = {
        startDate: '2025-01-25',
        endDate: '2025-02-05',
        ownerEmail: 'test@example.com',
      };

      await service.exportToSpreadsheet(crossMonthDto);

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api-harilibur.vercel.app/api?year=2025&month=1',
      );
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api-harilibur.vercel.app/api?year=2025&month=2',
      );
    });

    it('should create spreadsheet using GoogleSheetsClient', async () => {
      await service.exportToSpreadsheet(validDto);

      expect(googleSheetsClient.createSpreadsheet).toHaveBeenCalledWith(
        expect.stringContaining('Talent Leave'),
        expect.any(Array),
        expect.any(Array),
        expect.any(Object),
      );
    });

    it('should transfer ownership using GoogleSheetsClient', async () => {
      await service.exportToSpreadsheet(validDto);

      expect(googleSheetsClient.transferOwnership).toHaveBeenCalledWith(
        'test-spreadsheet-id',
        'test@example.com',
      );
    });

    it('should return success response DTO', async () => {
      const result = await service.exportToSpreadsheet(validDto);

      expect(result).toEqual({
        success: true,
        message: expect.stringContaining('test@example.com'),
        spreadsheetTitle: expect.stringContaining('Talent Leave'),
        dateRange: {
          startDate: '2025-01-13',
          endDate: '2025-01-17',
        },
        ownerEmail: 'test@example.com',
        exportedAt: expect.any(String),
      });
    });

    it('should format spreadsheet title with date range', async () => {
      const result = await service.exportToSpreadsheet(validDto);

      expect(result.spreadsheetTitle).toBe(
        'Talent Leave - 13/01/2025 to 17/01/2025',
      );
    });

    it('should throw InternalServerErrorException on Firestore error', async () => {
      jest
        .spyOn(repository, 'findAll')
        .mockRejectedValue(new Error('Firestore error'));

      await expect(service.exportToSpreadsheet(validDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException on Google API error', async () => {
      jest
        .spyOn(googleSheetsClient, 'createSpreadsheet')
        .mockRejectedValue(new Error('Google API error'));

      await expect(service.exportToSpreadsheet(validDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
