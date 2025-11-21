/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { GoogleSheetsClient } from './google-sheets.client';
import { google } from 'googleapis';

// Mock googleapis
jest.mock('googleapis');

describe('GoogleSheetsClient', () => {
  let client: GoogleSheetsClient;
  let mockSheets: any;
  let mockDrive: any;

  beforeEach(async () => {
    // Reset mocks
    mockSheets = {
      spreadsheets: {
        create: jest.fn(),
        values: {
          batchUpdate: jest.fn(),
        },
        batchUpdate: jest.fn(),
      },
    };

    mockDrive = {
      permissions: {
        create: jest.fn(),
      },
    };

    // Mock google.sheets and google.drive
    (google.sheets as jest.Mock) = jest.fn().mockReturnValue(mockSheets);
    (google.drive as jest.Mock) = jest.fn().mockReturnValue(mockDrive);
    (google.auth.GoogleAuth as any) = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleSheetsClient,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                GOOGLE_SERVICE_ACCOUNT_EMAIL: 'test@example.com',
                GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: 'test-key\\nwith-newline',
                GOOGLE_SERVICE_ACCOUNT_PROJECT_ID: 'test-project',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    client = module.get<GoogleSheetsClient>(GoogleSheetsClient);
  });

  describe('createSpreadsheet', () => {
    const mockTeamGroups = [
      {
        teamName: 'Engineering',
        memberCount: 2,
        members: [
          {
            id: '1',
            name: 'Alice',
            team: 'Engineering',
            leaveCount: 3,
            dateRange: '13-15 Jan',
            leaveDates: ['2025-01-13', '2025-01-14', '2025-01-15'],
            leaveDatesWithStatus: {
              '2025-01-13': 'Confirmed' as const,
              '2025-01-14': 'Confirmed' as const,
              '2025-01-15': 'Confirmed' as const,
            },
          },
        ],
      },
    ];

    const mockDateColumns = [
      {
        date: '2025-01-13',
        dayName: 'Mon',
        dayNumber: 13,
        isWeekend: false,
        isHoliday: false,
        isNationalHoliday: false,
      },
      {
        date: '2025-01-14',
        dayName: 'Tue',
        dayNumber: 14,
        isWeekend: false,
        isHoliday: false,
        isNationalHoliday: false,
      },
    ];

    const mockSprintGroups = {
      'Sprint 1 Q1 2025 (13 Jan - 26 Jan)': {
        name: 'Sprint 1 Q1 2025 (13 Jan - 26 Jan)',
        startDate: '2025-01-13',
        endDate: '2025-01-26',
        dateCount: 2,
      },
    };

    it('should create spreadsheet and return spreadsheet ID', async () => {
      mockSheets.spreadsheets.create.mockResolvedValue({
        data: { spreadsheetId: 'test-spreadsheet-id' },
      });
      mockSheets.spreadsheets.values.batchUpdate.mockResolvedValue({});
      mockSheets.spreadsheets.batchUpdate.mockResolvedValue({});

      const result = await client.createSpreadsheet(
        'Test Spreadsheet',
        mockTeamGroups,
        mockDateColumns,
        mockSprintGroups,
      );

      expect(result).toBe('test-spreadsheet-id');
    });

    it('should call sheets.spreadsheets.create with correct structure', async () => {
      mockSheets.spreadsheets.create.mockResolvedValue({
        data: { spreadsheetId: 'test-id' },
      });
      mockSheets.spreadsheets.values.batchUpdate.mockResolvedValue({});
      mockSheets.spreadsheets.batchUpdate.mockResolvedValue({});

      await client.createSpreadsheet(
        'Test Spreadsheet',
        mockTeamGroups,
        mockDateColumns,
        mockSprintGroups,
      );

      expect(mockSheets.spreadsheets.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            properties: expect.objectContaining({
              title: 'Test Spreadsheet',
            }),
            sheets: expect.arrayContaining([
              expect.objectContaining({
                properties: expect.objectContaining({
                  title: 'Leave Calendar',
                }),
              }),
            ]),
          }),
        }),
      );
    });

    it('should call sheets.values.batchUpdate to populate data', async () => {
      mockSheets.spreadsheets.create.mockResolvedValue({
        data: { spreadsheetId: 'test-id' },
      });
      mockSheets.spreadsheets.values.batchUpdate.mockResolvedValue({});
      mockSheets.spreadsheets.batchUpdate.mockResolvedValue({});

      await client.createSpreadsheet(
        'Test Spreadsheet',
        mockTeamGroups,
        mockDateColumns,
        mockSprintGroups,
      );

      expect(mockSheets.spreadsheets.values.batchUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          spreadsheetId: 'test-id',
          requestBody: expect.objectContaining({
            valueInputOption: 'RAW',
            data: expect.arrayContaining([
              expect.objectContaining({
                range: 'Leave Calendar!A1',
                values: expect.any(Array),
              }),
            ]),
          }),
        }),
      );
    });

    it('should call sheets.batchUpdate to apply styling', async () => {
      mockSheets.spreadsheets.create.mockResolvedValue({
        data: { spreadsheetId: 'test-id' },
      });
      mockSheets.spreadsheets.values.batchUpdate.mockResolvedValue({});
      mockSheets.spreadsheets.batchUpdate.mockResolvedValue({});

      await client.createSpreadsheet(
        'Test Spreadsheet',
        mockTeamGroups,
        mockDateColumns,
        mockSprintGroups,
      );

      expect(mockSheets.spreadsheets.batchUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          spreadsheetId: 'test-id',
          requestBody: expect.objectContaining({
            requests: expect.any(Array),
          }),
        }),
      );
    });

    it('should build header row with static columns and date columns', async () => {
      mockSheets.spreadsheets.create.mockResolvedValue({
        data: { spreadsheetId: 'test-id' },
      });
      mockSheets.spreadsheets.values.batchUpdate.mockResolvedValue({});
      mockSheets.spreadsheets.batchUpdate.mockResolvedValue({});

      await client.createSpreadsheet(
        'Test Spreadsheet',
        mockTeamGroups,
        mockDateColumns,
        mockSprintGroups,
      );

      const batchUpdateCall =
        mockSheets.spreadsheets.values.batchUpdate.mock.calls[0][0];
      const values = batchUpdateCall.requestBody.data[0].values;

      // Check header row
      expect(values[0][0]).toBe('No');
      expect(values[0][1]).toBe('Nama');
      expect(values[0][2]).toBe('Jumlah');
      expect(values[0][3]).toBe('Tanggal Cuti');
      expect(values[0][4]).toContain('13'); // Date column
    });

    it('should throw InternalServerErrorException on API failure', async () => {
      mockSheets.spreadsheets.create.mockRejectedValue(new Error('API Error'));

      await expect(
        client.createSpreadsheet(
          'Test Spreadsheet',
          mockTeamGroups,
          mockDateColumns,
          mockSprintGroups,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw error when spreadsheetId is missing', async () => {
      mockSheets.spreadsheets.create.mockResolvedValue({
        data: {},
      });

      await expect(
        client.createSpreadsheet(
          'Test Spreadsheet',
          mockTeamGroups,
          mockDateColumns,
          mockSprintGroups,
        ),
      ).rejects.toThrow('Failed to create spreadsheet');
    });
  });

  describe('transferOwnership', () => {
    it('should call drive.permissions.create with correct parameters', async () => {
      mockDrive.permissions.create.mockResolvedValue({});

      await client.transferOwnership('test-spreadsheet-id', 'user@example.com');

      expect(mockDrive.permissions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fileId: 'test-spreadsheet-id',
          requestBody: expect.objectContaining({
            type: 'user',
            role: 'owner',
            emailAddress: 'user@example.com',
          }),
          transferOwnership: true,
        }),
      );
    });

    it('should set role="owner" and transferOwnership=true', async () => {
      mockDrive.permissions.create.mockResolvedValue({});

      await client.transferOwnership('test-spreadsheet-id', 'user@example.com');

      const callArgs = mockDrive.permissions.create.mock.calls[0][0];
      expect(callArgs.requestBody.role).toBe('owner');
      expect(callArgs.transferOwnership).toBe(true);
    });

    it('should throw InternalServerErrorException on API failure', async () => {
      mockDrive.permissions.create.mockRejectedValue(new Error('API Error'));

      await expect(
        client.transferOwnership('test-spreadsheet-id', 'user@example.com'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('initialization', () => {
    it('should throw error when credentials are missing', async () => {
      const moduleWithoutCreds = await Test.createTestingModule({
        providers: [
          GoogleSheetsClient,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(undefined),
            },
          },
        ],
      }).compile();

      const clientWithoutCreds =
        moduleWithoutCreds.get<GoogleSheetsClient>(GoogleSheetsClient);

      await expect(
        clientWithoutCreds.createSpreadsheet('Test', [], [], {}),
      ).rejects.toThrow('Google Service Account credentials not configured');
    });
  });
});
