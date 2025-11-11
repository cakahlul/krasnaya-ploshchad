import axios from 'axios';
import { googleCalendarClient } from './googleCalendar';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('googleCalendarClient', () => {
  const mockApiKey = 'test-api-key';
  const originalEnv = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY = mockApiKey;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchHolidays', () => {
    it('should make GET request to Google Calendar API', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              start: { date: '2024-01-01' },
              summary: 'New Year',
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await googleCalendarClient.fetchHolidays('2024-01-01', '2024-01-31');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('googleapis.com/calendar/v3/calendars'),
        expect.any(Object)
      );
    });

    it('should include correct calendar ID (Indonesian holidays)', async () => {
      const mockResponse = {
        data: { items: [] },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await googleCalendarClient.fetchHolidays('2024-01-01', '2024-01-31');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('en.indonesian%23holiday@group.v.calendar.google.com'),
        expect.any(Object)
      );
    });

    it('should pass correct date range parameters', async () => {
      const mockResponse = {
        data: { items: [] },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      await googleCalendarClient.fetchHolidays(startDate, endDate);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            timeMin: '2024-01-01T00:00:00Z',
            timeMax: '2024-01-31T23:59:59Z',
          }),
        })
      );
    });

    it('should include API key from environment variable', async () => {
      const mockResponse = {
        data: { items: [] },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await googleCalendarClient.fetchHolidays('2024-01-01', '2024-01-31');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            key: mockApiKey,
          }),
        })
      );
    });

    it('should include singleEvents and orderBy parameters', async () => {
      const mockResponse = {
        data: { items: [] },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await googleCalendarClient.fetchHolidays('2024-01-01', '2024-01-31');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            singleEvents: true,
            orderBy: 'startTime',
          }),
        })
      );
    });

    it('should transform response to Holiday[] format', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              start: { date: '2024-01-01' },
              summary: 'New Year',
            },
            {
              start: { date: '2024-12-25' },
              summary: 'Christmas',
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await googleCalendarClient.fetchHolidays(
        '2024-01-01',
        '2024-12-31'
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2024-01-01',
        name: 'New Year',
      });
      expect(result[1]).toEqual({
        date: '2024-12-25',
        name: 'Christmas',
      });
    });

    it('should return empty array on error (graceful degradation)', async () => {
      const error = new Error('Network error');
      mockedAxios.get.mockRejectedValue(error);

      const result = await googleCalendarClient.fetchHolidays(
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch holidays from Google Calendar:',
        error
      );
    });

    it('should return empty array on API error response', async () => {
      const error = {
        response: {
          status: 403,
          data: { error: 'API key invalid' },
        },
      };
      mockedAxios.get.mockRejectedValue(error);

      const result = await googleCalendarClient.fetchHolidays(
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toEqual([]);
    });

    it('should handle empty items array', async () => {
      const mockResponse = {
        data: {
          items: [],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await googleCalendarClient.fetchHolidays(
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toEqual([]);
    });
  });
});
