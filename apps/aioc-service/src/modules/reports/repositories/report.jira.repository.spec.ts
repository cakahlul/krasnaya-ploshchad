/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Test, TestingModule } from '@nestjs/testing';
import { ReportJiraRepository } from './report.jira.repository';
import {
  JiraSearchRequestDto,
  JiraSearchResponseDto,
} from '../interfaces/report.dto';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ReportJiraRepository', () => {
  let repository: ReportJiraRepository;

  // Shared mock data
  const mockRequest: JiraSearchRequestDto = {
    sprint: 'sprint-1',
    assignees: ['user1', 'user2'],
    project: 'TEST',
  };

  const mockIssue1 = {
    expand: 'renderedFields,names,schema,operations,editmeta,changelog',
    id: '10001',
    self: 'https://your-domain.atlassian.net/rest/api/3/issue/10001',
    key: 'TEST-1',
    fields: {
      summary: 'Test Issue Summary 1',
      customfield_10005: 8,
      customfield_10865: {
        self: 'https://your-domain.atlassian.net/rest/api/3/customFieldOption/10652',
        value: 'Medium',
        id: '10652',
      },
      assignee: {
        self: 'https://your-domain.atlassian.net/rest/api/3/user?accountId=123',
        accountId: '123',
        displayName: 'John Doe',
      },
      issuetype: {
        self: 'https://your-domain.atlassian.net/rest/api/3/issuetype/10004',
        id: '10004',
        name: 'Story',
      },
    },
  };

  const mockIssue2 = {
    expand: 'renderedFields,names,schema,operations,editmeta,changelog',
    id: '10002',
    self: 'https://your-domain.atlassian.net/rest/api/3/issue/10002',
    key: 'TEST-2',
    fields: {
      summary: 'Test Issue Summary 2',
      customfield_10005: 5,
      customfield_10865: {
        self: 'https://your-domain.atlassian.net/rest/api/3/customFieldOption/10651',
        value: 'Low',
        id: '10651',
      },
      assignee: {
        self: 'https://your-domain.atlassian.net/rest/api/3/user?accountId=456',
        accountId: '456',
        displayName: 'Jane Smith',
      },
      issuetype: {
        self: 'https://your-domain.atlassian.net/rest/api/3/issuetype/10004',
        id: '10004',
        name: 'Story',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportJiraRepository],
    }).compile();

    repository = module.get<ReportJiraRepository>(ReportJiraRepository);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Token-based pagination', () => {
    const mockIssue = {
      expand: 'renderedFields,names,schema,operations,editmeta,changelog',
      id: '10001',
      self: 'https://your-domain.atlassian.net/rest/api/3/issue/10001',
      key: 'TEST-1',
      fields: {
        summary: 'Test Issue Summary',
        customfield_10005: 8,
        customfield_10865: {
          self: 'https://your-domain.atlassian.net/rest/api/3/customFieldOption/10652',
          value: 'Medium',
          id: '10652',
        },
        assignee: {
          self: 'https://your-domain.atlassian.net/rest/api/3/user?accountId=456',
          accountId: '456',
          emailAddress: 'assignee@example.com',
          displayName: 'Test Assignee',
          active: true,
          timeZone: 'UTC',
          accountType: 'atlassian',
        },
        customfield_10796: {
          self: 'https://your-domain.atlassian.net/rest/api/3/customFieldOption/456',
          value: 'SP Tech Debt',
          id: '456',
        },
        customfield_11015: {
          self: 'https://your-domain.atlassian.net/rest/api/3/customFieldOption/10652',
          value: 'Medium',
          id: '10652',
        },
        issuetype: {
          self: 'https://your-domain.atlassian.net/rest/api/3/issuetype/10002',
          id: '10002',
          description: 'A bug that needs to be fixed.',
          name: 'Bug',
        },
      },
    };

    it('should handle single page response (isLast: true)', async () => {
      const mockResponse: JiraSearchResponseDto = {
        isLast: true,
        issues: [mockIssue],
      };

      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await repository.fetchRawData(mockRequest);

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/rest/api/3/search/jql'),
        expect.objectContaining({
          auth: expect.any(Object),
          params: expect.objectContaining({
            jql: expect.any(String),
            maxResults: 100,
          }),
        }),
      );

      // Should not include nextPageToken in first request
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.not.objectContaining({
            nextPageToken: expect.any(String),
          }),
        }),
      );

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('TEST-1');
    });

    it('should handle multiple page response following nextPageToken chain', async () => {
      const firstPageResponse: JiraSearchResponseDto = {
        isLast: false,
        nextPageToken: 'token123',
        issues: [{ ...mockIssue, key: 'TEST-1' }],
      };

      const secondPageResponse: JiraSearchResponseDto = {
        isLast: false,
        nextPageToken: 'token456',
        issues: [{ ...mockIssue, key: 'TEST-2' }],
      };

      const finalPageResponse: JiraSearchResponseDto = {
        isLast: true,
        issues: [{ ...mockIssue, key: 'TEST-3' }],
      };

      mockedAxios.get
        .mockResolvedValueOnce({ data: firstPageResponse })
        .mockResolvedValueOnce({ data: secondPageResponse })
        .mockResolvedValueOnce({ data: finalPageResponse });

      const result = await repository.fetchRawData(mockRequest);

      expect(mockedAxios.get).toHaveBeenCalledTimes(3);

      // First request should not have nextPageToken
      expect(mockedAxios.get).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          params: expect.not.objectContaining({
            nextPageToken: expect.any(String),
          }),
        }),
      );

      // Second request should include first token
      expect(mockedAxios.get).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            nextPageToken: 'token123',
          }),
        }),
      );

      // Third request should include second token
      expect(mockedAxios.get).toHaveBeenNthCalledWith(
        3,
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            nextPageToken: 'token456',
          }),
        }),
      );

      expect(result).toHaveLength(3);
      expect(result[0].key).toBe('TEST-1');
      expect(result[1].key).toBe('TEST-2');
      expect(result[2].key).toBe('TEST-3');
    });

    it('should handle empty nextPageToken on first request correctly', async () => {
      const mockResponse: JiraSearchResponseDto = {
        isLast: true,
        issues: [mockIssue],
      };

      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      await repository.fetchRawData(mockRequest);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.not.objectContaining({
            nextPageToken: expect.any(String),
          }),
        }),
      );
    });

    it('should stop pagination when isLast becomes true', async () => {
      const firstPageResponse: JiraSearchResponseDto = {
        isLast: false,
        nextPageToken: 'token123',
        issues: [{ ...mockIssue, key: 'TEST-1' }],
      };

      const finalPageResponse: JiraSearchResponseDto = {
        isLast: true,
        // nextPageToken should be ignored when isLast is true
        nextPageToken: 'ignored-token',
        issues: [{ ...mockIssue, key: 'TEST-2' }],
      };

      mockedAxios.get
        .mockResolvedValueOnce({ data: firstPageResponse })
        .mockResolvedValueOnce({ data: finalPageResponse });

      const result = await repository.fetchRawData(mockRequest);

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should accumulate all issues across pages correctly', async () => {
      const pages = [
        {
          isLast: false,
          nextPageToken: 'token1',
          issues: [
            { ...mockIssue, key: 'TEST-1' },
            { ...mockIssue, key: 'TEST-2' },
          ],
        },
        {
          isLast: false,
          nextPageToken: 'token2',
          issues: [
            { ...mockIssue, key: 'TEST-3' },
            { ...mockIssue, key: 'TEST-4' },
          ],
        },
        {
          isLast: true,
          issues: [{ ...mockIssue, key: 'TEST-5' }],
        },
      ];

      pages.forEach((page) => {
        mockedAxios.get.mockResolvedValueOnce({ data: page });
      });

      const result = await repository.fetchRawData(mockRequest);

      expect(result).toHaveLength(5);
      expect(result.map((issue) => issue.key)).toEqual([
        'TEST-1',
        'TEST-2',
        'TEST-3',
        'TEST-4',
        'TEST-5',
      ]);
    });

    it('should handle missing nextPageToken gracefully', async () => {
      const mockResponse: JiraSearchResponseDto = {
        isLast: false,
        // nextPageToken is undefined - should be treated as final page
        issues: [mockIssue],
      };

      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await repository.fetchRawData(mockRequest);

      // Should only make one request since nextPageToken is missing
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });

    it('should implement rate limiting delay between pages', async () => {
      const firstPageResponse: JiraSearchResponseDto = {
        isLast: false,
        nextPageToken: 'token123',
        issues: [mockIssue],
      };

      const finalPageResponse: JiraSearchResponseDto = {
        isLast: true,
        issues: [mockIssue],
      };

      mockedAxios.get
        .mockResolvedValueOnce({ data: firstPageResponse })
        .mockResolvedValueOnce({ data: finalPageResponse });

      // Mock setTimeout to track if delay occurs
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      await repository.fetchRawData(mockRequest);

      // Should have rate limiting delay between requests
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

      setTimeoutSpy.mockRestore();
    });
  });

  describe('API Request Parameters', () => {
    const mockRequest: JiraSearchRequestDto = {
      sprint: 'sprint-1',
      assignees: ['user1', 'user2'],
      project: 'TEST',
    };

    beforeEach(() => {
      const mockResponse: JiraSearchResponseDto = {
        isLast: true,
        issues: [],
      };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });
    });

    it('should use correct endpoint /rest/api/3/search/jql', async () => {
      await repository.fetchRawData(mockRequest);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/rest/api/3/search/jql'),
        expect.any(Object),
      );
    });

    it('should preserve existing parameters: jql, maxResults, fields, validateQuery', async () => {
      await repository.fetchRawData(mockRequest);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            jql: expect.stringContaining('project = TEST'),
            maxResults: 100,
            fields: expect.stringContaining('customfield_10005'),
            validateQuery: 'strict',
          }),
        }),
      );
    });

    it('should not include startAt parameter', async () => {
      await repository.fetchRawData(mockRequest);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.not.objectContaining({
            startAt: expect.any(Number),
          }),
        }),
      );
    });

    it('should include nextPageToken when provided', async () => {
      const firstPageResponse: JiraSearchResponseDto = {
        isLast: false,
        nextPageToken: 'test-token',
        issues: [],
      };

      const finalPageResponse: JiraSearchResponseDto = {
        isLast: true,
        issues: [],
      };

      mockedAxios.get
        .mockResolvedValueOnce({ data: firstPageResponse })
        .mockResolvedValueOnce({ data: finalPageResponse });

      await repository.fetchRawData(mockRequest);

      // Second call should include the token
      expect(mockedAxios.get).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            nextPageToken: 'test-token',
          }),
        }),
      );
    });
  });

  describe('Data Transformation', () => {
    it('should maintain transformIssues compatibility', async () => {
      const mockIssue = {
        expand: 'renderedFields,names,schema',
        id: '10001',
        self: 'https://test.atlassian.net/rest/api/3/issue/10001',
        key: 'TEST-1',
        fields: {
          summary: 'Test Issue',
          customfield_10005: 5,
          customfield_10865: {
            self: 'https://test.atlassian.net/rest/api/3/customFieldOption/123',
            value: 'High',
            id: '123',
          },
          assignee: {
            self: 'https://test.atlassian.net/rest/api/3/user?accountId=456',
            accountId: '456',
            displayName: 'Test User',
            emailAddress: 'test@example.com',
            active: true,
            timeZone: 'UTC',
            accountType: 'atlassian',
          },
          customfield_10796: {
            self: 'https://test.atlassian.net/rest/api/3/customFieldOption/789',
            value: 'SP Product',
            id: '789',
          },
          customfield_11015: {
            self: 'https://test.atlassian.net/rest/api/3/customFieldOption/101',
            value: 'High',
            id: '101',
          },
          issuetype: {
            self: 'https://test.atlassian.net/rest/api/3/issuetype/10001',
            name: 'Story',
            id: '10001',
            description: 'A user story.',
          },
        },
      };

      const mockResponse: JiraSearchResponseDto = {
        isLast: true,
        issues: [mockIssue],
      };

      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await repository.fetchRawData({
        sprint: 'test',
        assignees: ['test'],
        project: 'TEST',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '10001',
        key: 'TEST-1',
        summary: 'Test Issue',
        fields: mockIssue.fields,
      });
    });
  });

  describe('Enhanced Error Handling with Retry Logic', () => {
    const mockRequest: JiraSearchRequestDto = {
      sprint: 'sprint-1',
      assignees: ['user1'],
      project: 'TEST',
    };

    beforeEach(() => {
      // Mock setTimeout to resolve immediately for faster tests
      jest
        .spyOn(global, 'setTimeout')
        .mockImplementation((callback: (...args: unknown[]) => void) => {
          process.nextTick(callback);
          return {} as NodeJS.Timeout;
        });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should fail fast on authentication errors (401) without retries', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { errorMessages: ['Authentication failed'] },
        },
        config: {},
        isAxiosError: true,
      });

      const startTime = Date.now();
      await expect(repository.fetchRawData(mockRequest)).rejects.toThrow(
        'Failed to fetch data from Jira',
      );
      const endTime = Date.now();

      // Should fail immediately without retry delays (allow up to 1 second for processing)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should fail fast on authorization errors (403) without retries', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 403,
          statusText: 'Forbidden',
          data: { errorMessages: ['Insufficient permissions'] },
        },
        config: {},
        isAxiosError: true,
      });

      await expect(repository.fetchRawData(mockRequest)).rejects.toThrow(
        'Failed to fetch data from Jira',
      );

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should fail fast on validation errors (400) without retries', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { errorMessages: ['Invalid JQL query'] },
        },
        config: {},
        isAxiosError: true,
      });

      await expect(repository.fetchRawData(mockRequest)).rejects.toThrow(
        'Failed to fetch data from Jira',
      );

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should retry on rate limit errors (429) with exponential backoff', async () => {
      const rateLimitError = {
        response: {
          status: 429,
          statusText: 'Too Many Requests',
          headers: { 'retry-after': '2' },
        },
        config: {},
        isAxiosError: true,
      };

      const successResponse = {
        data: {
          isLast: true,
          issues: [],
        },
      };

      // First two calls return rate limit, third succeeds
      mockedAxios.get
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(successResponse);

      const promise = repository.fetchRawData(mockRequest);

      const result = await promise;

      expect(result).toEqual([]);
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it('should retry on network timeout errors with exponential backoff', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
        config: {},
        isAxiosError: true,
      };

      const successResponse = {
        data: {
          isLast: true,
          issues: [],
        },
      };

      // First call times out, second succeeds
      mockedAxios.get
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce(successResponse);

      const result = await repository.fetchRawData(mockRequest);

      expect(result).toEqual([]);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should retry on network connection errors with exponential backoff', async () => {
      const networkError = {
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND api.atlassian.net',
        config: {},
        isAxiosError: true,
      };

      const successResponse = {
        data: {
          isLast: true,
          issues: [],
        },
      };

      // Network error then success
      mockedAxios.get
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successResponse);

      const result = await repository.fetchRawData(mockRequest);

      expect(result).toEqual([]);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should implement exponential backoff delay pattern', async () => {
      const networkError = {
        code: 'ENOTFOUND',
        message: 'Network error',
        config: {},
        isAxiosError: true,
      };

      const successResponse = {
        data: {
          isLast: true,
          issues: [],
        },
      };

      // Multiple failures then success
      mockedAxios.get
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successResponse);

      // Use a specific spy that captures the delay values
      const setTimeoutSpy = jest
        .spyOn(global, 'setTimeout')
        .mockImplementation((callback: (...args: unknown[]) => void) => {
          process.nextTick(callback);
          return {} as NodeJS.Timeout;
        });

      await repository.fetchRawData(mockRequest);

      // Verify exponential backoff: 1000ms, 2000ms, 4000ms
      expect(setTimeoutSpy).toHaveBeenNthCalledWith(
        1,
        expect.any(Function),
        1000,
      );
      expect(setTimeoutSpy).toHaveBeenNthCalledWith(
        2,
        expect.any(Function),
        2000,
      );
      expect(setTimeoutSpy).toHaveBeenNthCalledWith(
        3,
        expect.any(Function),
        4000,
      );

      setTimeoutSpy.mockRestore();
    });

    it('should throw error when max retry attempts are reached', async () => {
      const networkError = {
        code: 'ENOTFOUND',
        message: 'Network error',
        config: {},
        isAxiosError: true,
      };

      // Always fail
      mockedAxios.get.mockRejectedValue(networkError);

      await expect(repository.fetchRawData(mockRequest)).rejects.toThrow(
        'Failed to fetch data from Jira',
      );

      // Should try initial + 3 retries = 4 total calls
      expect(mockedAxios.get).toHaveBeenCalledTimes(4);
    });

    it('should succeed after transient failure within retry limits', async () => {
      const networkError = {
        code: 'ECONNRESET',
        message: 'Connection reset',
        config: {},
        isAxiosError: true,
      };

      const successResponse = {
        data: {
          isLast: true,
          issues: [
            {
              expand: 'test',
              id: '1',
              self: 'test',
              key: 'TEST-1',
              fields: {
                summary: 'Test',
                customfield_10005: 5,
                customfield_10865: { self: 'test', value: 'Low', id: '1' },
                assignee: {
                  self: 'test',
                  accountId: '1',
                  emailAddress: 'test@test.com',
                  displayName: 'Test',
                  active: true,
                  timeZone: 'UTC',
                  accountType: 'atlassian',
                },
                customfield_10796: { self: 'test', value: 'Product', id: '1' },
                customfield_11015: { self: 'test', value: 'Low', id: '1' },
                issuetype: {
                  self: 'test',
                  id: '1',
                  description: 'Test',
                  name: 'Story',
                },
              },
            },
          ],
        },
      };

      // Fail twice, then succeed
      mockedAxios.get
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successResponse);

      const result = await repository.fetchRawData(mockRequest);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('TEST-1');
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it('should handle malformed API responses', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { invalidResponse: true },
      });

      // Should handle missing required fields gracefully
      await expect(repository.fetchRawData(mockRequest)).rejects.toThrow(
        'Failed to fetch data from Jira',
      );
    });

    it('should preserve existing error logging behavior', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const networkError = new Error('Network error');
      mockedAxios.get.mockRejectedValue(networkError);

      await expect(repository.fetchRawData(mockRequest)).rejects.toThrow(
        'Failed to fetch data from Jira',
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching data from Jira:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Configuration Management', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      // Save original environment
      originalEnv = { ...process.env };

      // Clear environment variables for clean testing
      delete process.env.JIRA_SEARCH_ENDPOINT;
      delete process.env.JIRA_MAX_RESULTS;
      delete process.env.JIRA_RATE_LIMIT_MS;
      delete process.env.JIRA_REQUEST_TIMEOUT;
      delete process.env.JIRA_RETRY_ATTEMPTS;
    });

    afterEach(() => {
      // Restore original environment
      process.env = originalEnv;
    });

    it('should load JIRA_SEARCH_ENDPOINT from environment with default fallback', () => {
      // Test with custom environment variable
      process.env.JIRA_SEARCH_ENDPOINT = '/custom/endpoint';
      const repositoryWithCustom = new ReportJiraRepository();
      expect(repositoryWithCustom['searchEndpoint']).toBe('/custom/endpoint');

      // Test with default fallback
      delete process.env.JIRA_SEARCH_ENDPOINT;
      const repositoryWithDefault = new ReportJiraRepository();
      expect(repositoryWithDefault['searchEndpoint']).toBe(
        '/rest/api/3/search/jql',
      );
    });

    it('should load JIRA_MAX_RESULTS with default 100', () => {
      // Test with custom environment variable
      process.env.JIRA_MAX_RESULTS = '50';
      const repositoryWithCustom = new ReportJiraRepository();
      expect(repositoryWithCustom['maxResults']).toBe(50);

      // Test with default fallback
      delete process.env.JIRA_MAX_RESULTS;
      const repositoryWithDefault = new ReportJiraRepository();
      expect(repositoryWithDefault['maxResults']).toBe(100);
    });

    it('should load JIRA_RATE_LIMIT_MS with default 1000', () => {
      // Test with custom environment variable
      process.env.JIRA_RATE_LIMIT_MS = '2000';
      const repositoryWithCustom = new ReportJiraRepository();
      expect(repositoryWithCustom['rateLimitMs']).toBe(2000);

      // Test with default fallback
      delete process.env.JIRA_RATE_LIMIT_MS;
      const repositoryWithDefault = new ReportJiraRepository();
      expect(repositoryWithDefault['rateLimitMs']).toBe(1000);
    });

    it('should load JIRA_REQUEST_TIMEOUT with default 30000', () => {
      // Test with custom environment variable
      process.env.JIRA_REQUEST_TIMEOUT = '60000';
      const repositoryWithCustom = new ReportJiraRepository();
      expect(repositoryWithCustom['requestTimeout']).toBe(60000);

      // Test with default fallback
      delete process.env.JIRA_REQUEST_TIMEOUT;
      const repositoryWithDefault = new ReportJiraRepository();
      expect(repositoryWithDefault['requestTimeout']).toBe(30000);
    });

    it('should load JIRA_RETRY_ATTEMPTS with default 3', () => {
      // Test with custom environment variable
      process.env.JIRA_RETRY_ATTEMPTS = '5';
      const repositoryWithCustom = new ReportJiraRepository();
      expect(repositoryWithCustom['maxRetryAttempts']).toBe(5);

      // Test with default fallback
      delete process.env.JIRA_RETRY_ATTEMPTS;
      const repositoryWithDefault = new ReportJiraRepository();
      expect(repositoryWithDefault['maxRetryAttempts']).toBe(3);
    });

    it('should validate and handle invalid values gracefully', () => {
      // Test with invalid numeric values - should use defaults
      process.env.JIRA_MAX_RESULTS = 'invalid';
      process.env.JIRA_RATE_LIMIT_MS = 'not-a-number';
      process.env.JIRA_REQUEST_TIMEOUT = '-1';
      process.env.JIRA_RETRY_ATTEMPTS = '0';

      const repository = new ReportJiraRepository();

      // Should fall back to defaults for invalid values
      expect(repository['maxResults']).toBe(100);
      expect(repository['rateLimitMs']).toBe(1000);
      expect(repository['requestTimeout']).toBe(30000);
      expect(repository['maxRetryAttempts']).toBe(3);
    });

    it('should validate numeric ranges for configuration values', () => {
      // Test boundary values
      process.env.JIRA_MAX_RESULTS = '1';
      process.env.JIRA_RATE_LIMIT_MS = '100';
      process.env.JIRA_REQUEST_TIMEOUT = '5000';
      process.env.JIRA_RETRY_ATTEMPTS = '1';

      const repository = new ReportJiraRepository();

      expect(repository['maxResults']).toBe(1);
      expect(repository['rateLimitMs']).toBe(100);
      expect(repository['requestTimeout']).toBe(5000);
      expect(repository['maxRetryAttempts']).toBe(1);
    });

    it('should enforce maximum limits for configuration values', () => {
      // Test values that exceed reasonable maximums
      process.env.JIRA_MAX_RESULTS = '10000'; // Too high
      process.env.JIRA_RATE_LIMIT_MS = '60000'; // Too high
      process.env.JIRA_REQUEST_TIMEOUT = '300000'; // Too high
      process.env.JIRA_RETRY_ATTEMPTS = '50'; // Too many

      const repository = new ReportJiraRepository();

      // Should be capped at reasonable maximums
      expect(repository['maxResults']).toBeLessThanOrEqual(1000);
      expect(repository['rateLimitMs']).toBeLessThanOrEqual(30000);
      expect(repository['requestTimeout']).toBeLessThanOrEqual(120000);
      expect(repository['maxRetryAttempts']).toBeLessThanOrEqual(10);
    });
  });

  describe('Comprehensive Logging', () => {
    let mockLogger: {
      log: jest.Mock;
      warn: jest.Mock;
      error: jest.Mock;
    };
    let repositoryWithMockLogger: ReportJiraRepository;

    beforeEach(async () => {
      // Create mock logger
      mockLogger = {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      // Create a new test module for this describe block
      const module: TestingModule = await Test.createTestingModule({
        providers: [ReportJiraRepository],
      }).compile();

      repositoryWithMockLogger =
        module.get<ReportJiraRepository>(ReportJiraRepository);

      // Replace the logger instance with our mock
      (repositoryWithMockLogger as any).logger = mockLogger;
    });

    it('should log successful API calls with request details excluding auth tokens', async () => {
      // Mock successful multi-page response
      const mockResponsePage1 = {
        data: {
          issues: [mockIssue1],
          isLast: false,
          nextPageToken: 'token123',
        },
      };
      const mockResponsePage2 = {
        data: {
          issues: [mockIssue2],
          isLast: true,
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockResponsePage1)
        .mockResolvedValueOnce(mockResponsePage2);

      await repositoryWithMockLogger.fetchRawData(mockRequest);

      // Verify successful API calls are logged
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Jira API request successful',
        expect.objectContaining({
          page: 1,
          issues: 1,
          hasNextPage: true,
        }),
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Jira API request successful',
        expect.objectContaining({
          page: 2,
          issues: 1,
          hasNextPage: false,
        }),
      );

      // Verify no sensitive auth data in logs
      const logCalls = mockLogger.log.mock.calls;
      logCalls.forEach((call) => {
        const logMessage = JSON.stringify(call);
        expect(logMessage).not.toContain('password');
        expect(logMessage).not.toContain('token');
        expect(logMessage).not.toContain('auth');
      });
    });

    it('should log failed API calls with error details and context', async () => {
      const mockError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { errorMessages: ['Server error'] },
        },
        config: { url: 'https://test.atlassian.net/rest/api/3/search/jql' },
        isAxiosError: true,
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);

      try {
        await repositoryWithMockLogger.fetchRawData(mockRequest);
      } catch {
        // Expected to throw
      }

      // Verify error logging (the mock causes executeWithRetry to fail)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Jira API error',
        expect.objectContaining({
          context: 'fetchRawData',
        }),
      );

      // Verify sensitive data excluded from error logs
      const errorCalls = mockLogger.error.mock.calls;
      errorCalls.forEach((call) => {
        const logMessage = JSON.stringify(call);
        expect(logMessage).not.toContain('password');
        expect(logMessage).not.toContain('JIRA_API_TOKEN');
      });
    });

    it('should log rate limiting events with appropriate details', async () => {
      const mockResponsePage1 = {
        data: {
          issues: [mockIssue1],
          isLast: false,
          nextPageToken: 'token123',
        },
      };
      const mockResponsePage2 = {
        data: {
          issues: [mockIssue2],
          isLast: true,
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockResponsePage1)
        .mockResolvedValueOnce(mockResponsePage2);

      await repositoryWithMockLogger.fetchRawData(mockRequest);

      // Verify rate limiting is logged
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Rate limit applied',
        expect.objectContaining({
          delay: expect.any(Number),
          page: 1,
        }),
      );
    });

    it('should log pagination progress with sanitized tokens', async () => {
      const mockResponsePage1 = {
        data: {
          issues: [mockIssue1],
          isLast: false,
          nextPageToken: 'secretToken123',
        },
      };
      const mockResponsePage2 = {
        data: {
          issues: [mockIssue2],
          isLast: true,
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockResponsePage1)
        .mockResolvedValueOnce(mockResponsePage2);

      await repositoryWithMockLogger.fetchRawData(mockRequest);

      // Verify pagination progress logging
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Pagination progress',
        expect.objectContaining({
          page: 1,
          hasNextPage: true,
          nextPageToken: '***TOKEN***', // Should be sanitized
        }),
      );
    });

    it('should exclude sensitive data from all log outputs', async () => {
      // Set environment variables with sensitive data
      process.env.JIRA_API_TOKEN = 'sensitive-token-123';
      process.env.JIRA_USERNAME = 'sensitive-user';

      const mockError = {
        response: {
          status: 401,
          statusText: 'Unauthorized',
        },
        config: {
          auth: {
            username: 'sensitive-user',
            password: 'sensitive-token-123',
          },
        },
        isAxiosError: true,
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);

      try {
        await repositoryWithMockLogger.fetchRawData(mockRequest);
      } catch {
        // Expected to throw
      }

      // Check all log calls for sensitive data
      const allCalls = [
        ...mockLogger.log.mock.calls,
        ...mockLogger.warn.mock.calls,
        ...mockLogger.error.mock.calls,
      ];

      allCalls.forEach((call) => {
        const logMessage = JSON.stringify(call);
        expect(logMessage).not.toContain('sensitive-token-123');
        expect(logMessage).not.toContain('sensitive-user');
        expect(logMessage).not.toContain(process.env.JIRA_API_TOKEN);
        expect(logMessage).not.toContain(process.env.JIRA_USERNAME);
      });
    });

    it('should use appropriate log levels for different scenarios', async () => {
      // Test successful request (info level)
      const mockSuccessResponse = {
        data: {
          issues: [mockIssue1],
          isLast: true,
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockSuccessResponse);

      await repositoryWithMockLogger.fetchRawData(mockRequest);

      // Verify log level usage
      expect(mockLogger.log).toHaveBeenCalled(); // Info level for success
      expect(mockLogger.warn).not.toHaveBeenCalled(); // No warnings for single page
      expect(mockLogger.error).not.toHaveBeenCalled(); // No errors

      // Reset mocks
      mockLogger.log.mockClear();
      mockLogger.warn.mockClear();
      mockLogger.error.mockClear();

      // Test rate limiting scenario (warn level)
      const mockMultiPageResponse1 = {
        data: {
          issues: [mockIssue1],
          isLast: false,
          nextPageToken: 'token123',
        },
      };
      const mockMultiPageResponse2 = {
        data: {
          issues: [mockIssue2],
          isLast: true,
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockMultiPageResponse1)
        .mockResolvedValueOnce(mockMultiPageResponse2);

      await repositoryWithMockLogger.fetchRawData(mockRequest);

      expect(mockLogger.warn).toHaveBeenCalled(); // Warn level for rate limiting
    });
  });
});
