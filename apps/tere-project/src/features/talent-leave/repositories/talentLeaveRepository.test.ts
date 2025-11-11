import { talentLeaveRepository } from './talentLeaveRepository';
import axiosClient from '@src/lib/axiosClient';
import type {
  TalentLeaveResponse,
  TalentResponse,
  CreateLeaveRequest,
  UpdateLeaveRequest,
} from '../types/talent-leave.types';

// Mock axiosClient
jest.mock('@src/lib/axiosClient');
const mockedAxiosClient = axiosClient as jest.Mocked<typeof axiosClient>;

describe('talentLeaveRepository', () => {
  const baseUrl = process.env.NEXT_PUBLIC_AIOC_SERVICE;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchLeaveRecords', () => {
    it('should make GET request with correct query params', async () => {
      const mockResponse: TalentLeaveResponse[] = [
        {
          id: '1',
          name: 'John Doe',
          team: 'Engineering',
          dateFrom: '2024-01-15T00:00:00Z',
          dateTo: '2024-01-20T00:00:00Z',
          status: 'Confirmed',
          role: 'Developer',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockedAxiosClient.get.mockResolvedValue({ data: mockResponse });

      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const result = await talentLeaveRepository.fetchLeaveRecords(
        startDate,
        endDate
      );

      expect(mockedAxiosClient.get).toHaveBeenCalledWith(
        `${baseUrl}/talent-leave?startDate=${startDate}&endDate=${endDate}`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include date filters in request', async () => {
      mockedAxiosClient.get.mockResolvedValue({ data: [] });

      const startDate = '2024-01-01';
      const endDate = '2024-02-29';

      await talentLeaveRepository.fetchLeaveRecords(startDate, endDate);

      expect(mockedAxiosClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`startDate=${startDate}`)
      );
      expect(mockedAxiosClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`endDate=${endDate}`)
      );
    });

    it('should include optional status filter', async () => {
      mockedAxiosClient.get.mockResolvedValue({ data: [] });

      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const filters = { status: 'Confirmed' };

      await talentLeaveRepository.fetchLeaveRecords(
        startDate,
        endDate,
        filters
      );

      expect(mockedAxiosClient.get).toHaveBeenCalledWith(
        expect.stringContaining('status=Confirmed')
      );
    });

    it('should include optional team filter', async () => {
      mockedAxiosClient.get.mockResolvedValue({ data: [] });

      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const filters = { team: 'Engineering' };

      await talentLeaveRepository.fetchLeaveRecords(
        startDate,
        endDate,
        filters
      );

      expect(mockedAxiosClient.get).toHaveBeenCalledWith(
        expect.stringContaining('team=Engineering')
      );
    });

    it('should include both status and team filters', async () => {
      mockedAxiosClient.get.mockResolvedValue({ data: [] });

      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const filters = { status: 'Draft', team: 'Product' };

      await talentLeaveRepository.fetchLeaveRecords(
        startDate,
        endDate,
        filters
      );

      const callArg = mockedAxiosClient.get.mock.calls[0][0];
      expect(callArg).toContain('status=Draft');
      expect(callArg).toContain('team=Product');
    });

    it('should handle axios errors gracefully', async () => {
      const error = new Error('Network error');
      mockedAxiosClient.get.mockRejectedValue(error);

      await expect(
        talentLeaveRepository.fetchLeaveRecords('2024-01-01', '2024-01-31')
      ).rejects.toThrow('Network error');
    });
  });

  describe('fetchTalentList', () => {
    it('should make GET request to /talent-leave/talents', async () => {
      const mockResponse: TalentResponse[] = [
        {
          id: '1',
          name: 'John Doe',
          team: 'Engineering',
          role: 'Developer',
        },
        {
          id: '2',
          name: 'Jane Smith',
          team: 'Product',
          role: 'Product Manager',
        },
      ];

      mockedAxiosClient.get.mockResolvedValue({ data: mockResponse });

      const result = await talentLeaveRepository.fetchTalentList();

      expect(mockedAxiosClient.get).toHaveBeenCalledWith(
        `${baseUrl}/talent-leave/talents`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle axios errors gracefully', async () => {
      const error = new Error('Server error');
      mockedAxiosClient.get.mockRejectedValue(error);

      await expect(talentLeaveRepository.fetchTalentList()).rejects.toThrow(
        'Server error'
      );
    });
  });

  describe('createLeave', () => {
    it('should make POST request with correct payload', async () => {
      const createRequest: CreateLeaveRequest = {
        name: 'John Doe',
        team: 'Engineering',
        role: 'Developer',
        dateFrom: '2024-01-15T00:00:00Z',
        dateTo: '2024-01-20T00:00:00Z',
        status: 'Draft',
      };

      const mockResponse: TalentLeaveResponse = {
        id: '123',
        ...createRequest,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockedAxiosClient.post.mockResolvedValue({ data: mockResponse });

      const result = await talentLeaveRepository.createLeave(createRequest);

      expect(mockedAxiosClient.post).toHaveBeenCalledWith(
        `${baseUrl}/talent-leave`,
        createRequest
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle axios errors gracefully', async () => {
      const createRequest: CreateLeaveRequest = {
        name: 'John Doe',
        team: 'Engineering',
        role: 'Developer',
        dateFrom: '2024-01-15T00:00:00Z',
        dateTo: '2024-01-20T00:00:00Z',
        status: 'Draft',
      };

      const error = new Error('Validation error');
      mockedAxiosClient.post.mockRejectedValue(error);

      await expect(
        talentLeaveRepository.createLeave(createRequest)
      ).rejects.toThrow('Validation error');
    });
  });

  describe('updateLeave', () => {
    it('should make PUT request to /talent-leave/:id with payload', async () => {
      const leaveId = '123';
      const updateRequest: UpdateLeaveRequest = {
        status: 'Confirmed',
      };

      const mockResponse: TalentLeaveResponse = {
        id: leaveId,
        name: 'John Doe',
        team: 'Engineering',
        role: 'Developer',
        dateFrom: '2024-01-15T00:00:00Z',
        dateTo: '2024-01-20T00:00:00Z',
        status: 'Confirmed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      mockedAxiosClient.put.mockResolvedValue({ data: mockResponse });

      const result = await talentLeaveRepository.updateLeave(
        leaveId,
        updateRequest
      );

      expect(mockedAxiosClient.put).toHaveBeenCalledWith(
        `${baseUrl}/talent-leave/${leaveId}`,
        updateRequest
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle partial updates', async () => {
      const leaveId = '123';
      const updateRequest: UpdateLeaveRequest = {
        dateFrom: '2024-01-16T00:00:00Z',
        dateTo: '2024-01-21T00:00:00Z',
      };

      const mockResponse: TalentLeaveResponse = {
        id: leaveId,
        name: 'John Doe',
        team: 'Engineering',
        role: 'Developer',
        dateFrom: '2024-01-16T00:00:00Z',
        dateTo: '2024-01-21T00:00:00Z',
        status: 'Draft',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      mockedAxiosClient.put.mockResolvedValue({ data: mockResponse });

      const result = await talentLeaveRepository.updateLeave(
        leaveId,
        updateRequest
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle axios errors gracefully', async () => {
      const error = new Error('Not found');
      mockedAxiosClient.put.mockRejectedValue(error);

      await expect(
        talentLeaveRepository.updateLeave('123', { status: 'Confirmed' })
      ).rejects.toThrow('Not found');
    });
  });

  describe('deleteLeave', () => {
    it('should make DELETE request to /talent-leave/:id', async () => {
      const leaveId = '123';

      mockedAxiosClient.delete.mockResolvedValue({ data: undefined });

      await talentLeaveRepository.deleteLeave(leaveId);

      expect(mockedAxiosClient.delete).toHaveBeenCalledWith(
        `${baseUrl}/talent-leave/${leaveId}`
      );
    });

    it('should handle axios errors gracefully', async () => {
      const error = new Error('Delete failed');
      mockedAxiosClient.delete.mockRejectedValue(error);

      await expect(talentLeaveRepository.deleteLeave('123')).rejects.toThrow(
        'Delete failed'
      );
    });
  });
});
