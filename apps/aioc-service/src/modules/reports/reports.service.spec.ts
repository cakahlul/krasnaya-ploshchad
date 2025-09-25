import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { ReportJiraRepository } from './repositories/report.jira.repository';
import { JiraIssueEntity } from './interfaces/report.entity';

// Mock the shared dependencies
jest.mock('../../shared/constants/team-member.const', () => ({
  teamMembers: [
    {
      name: 'Lekha',
      id: '615ac0fda707100069885ad5',
      email: 'lekha.sholehati@amarbank.co.id',
      team: ['DS', 'SLS'],
      level: 'junior',
    },
    {
      name: 'Tasrifin',
      id: '712020:1d6d1b04-9241-4007-8159-cf44b72ba81f',
      email: 'tasrifin@amarbank.co.id',
      team: ['SLS'],
      level: 'medior',
    },
    {
      name: 'Luqman',
      id: '712020:2fe52388-cf5e-4930-be5f-58495306745f',
      email: 'luqman.nugroho@amarbank.co.id',
      team: ['SLS'],
      level: 'senior',
    },
    {
      name: 'Rahmad',
      id: '712020:0b37a477-f775-4c05-af72-0c82164b5af5',
      email: 'rahmad.hidayat@amarbank.co.id',
      team: ['SLS'],
      level: 'senior',
    },
  ],
}));

describe('ReportsService', () => {
  let service: ReportsService;
  let mockRepository: jest.Mocked<ReportJiraRepository>;

  // Helper function to create complete mock entities
  const createMockJiraIssueEntity = (
    overrides: Partial<JiraIssueEntity> = {},
  ): JiraIssueEntity => {
    const base: JiraIssueEntity = {
      id: '10001',
      key: 'TEST-1',
      summary: 'Test Issue',
      fields: {
        summary: 'Test Issue',
        customfield_10005: 8,
        customfield_10796: {
          self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10001',
          value: 'SP Product',
          id: '10001',
        },
        customfield_10865: {
          self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10652',
          value: 'Medium',
          id: '10652',
        },
        customfield_11015: {
          self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10652',
          value: 'Medium',
          id: '10652',
        },
        assignee: {
          self: 'https://test.atlassian.net/rest/api/3/user?accountId=123',
          accountId: '615ac0fda707100069885ad5',
          emailAddress: 'test@amarbank.co.id',
          displayName: 'Lekha',
          active: true,
          timeZone: 'Asia/Jakarta',
          accountType: 'atlassian',
        },
        issuetype: {
          self: 'https://test.atlassian.net/rest/api/3/issuetype/10004',
          id: '10004',
          description: 'A task that needs to be done.',
          name: 'Story',
        },
      },
    };

    // Deep merge overrides
    if (overrides.fields) {
      base.fields = { ...base.fields, ...overrides.fields };
    }
    return { ...base, ...overrides };
  };

  beforeEach(async () => {
    // Create mock repository
    const mockRepositoryFactory = () => ({
      fetchRawData: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: ReportJiraRepository,
          useFactory: mockRepositoryFactory,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    mockRepository = module.get(ReportJiraRepository);
  });

  describe('Service Layer Compatibility', () => {
    describe('generateReport() compatibility', () => {
      it('should produce identical results to legacy implementation', async () => {
        // Mock repository response with new token-based pagination format
        const mockRepositoryResponse: JiraIssueEntity[] = [
          createMockJiraIssueEntity({
            id: '10001',
            key: 'TEST-1',
            summary: 'Test Issue 1',
            fields: {
              summary: 'Test Issue 1',
              customfield_10005: 8,
              customfield_10796: {
                self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10001',
                value: 'SP Product',
                id: '10001',
              },
              customfield_10865: {
                self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10652',
                value: 'Medium',
                id: '10652',
              },
              customfield_11015: {
                self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10652',
                value: 'Medium',
                id: '10652',
              },
              assignee: {
                self: 'https://test.atlassian.net/rest/api/3/user?accountId=123',
                accountId: '615ac0fda707100069885ad5',
                emailAddress: 'lekha.sholehati@amarbank.co.id',
                displayName: 'Lekha',
                active: true,
                timeZone: 'Asia/Jakarta',
                accountType: 'atlassian',
              },
              issuetype: {
                self: 'https://test.atlassian.net/rest/api/3/issuetype/10004',
                id: '10004',
                description: 'A task that needs to be done.',
                name: 'Story',
              },
            },
          }),
          createMockJiraIssueEntity({
            id: '10002',
            key: 'TEST-2',
            summary: 'Test Issue 2',
            fields: {
              summary: 'Test Issue 2',
              customfield_10005: 5,
              customfield_10796: {
                self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10002',
                value: 'SP Tech Debt',
                id: '10002',
              },
              customfield_10865: {
                self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10651',
                value: 'Low',
                id: '10651',
              },
              customfield_11015: {
                self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10651',
                value: 'Low',
                id: '10651',
              },
              assignee: {
                self: 'https://test.atlassian.net/rest/api/3/user?accountId=456',
                accountId: '712020:1d6d1b04-9241-4007-8159-cf44b72ba81f',
                emailAddress: 'tasrifin@amarbank.co.id',
                displayName: 'Tasrifin',
                active: true,
                timeZone: 'Asia/Jakarta',
                accountType: 'atlassian',
              },
              issuetype: {
                self: 'https://test.atlassian.net/rest/api/3/issuetype/10001',
                id: '10001',
                description:
                  'A problem which impairs or prevents the functions of the product.',
                name: 'Bug',
              },
            },
          }),
        ];

        mockRepository.fetchRawData.mockResolvedValue(mockRepositoryResponse);

        const result = await service.generateReport('sprint-1', 'SLS');

        // Validate the structure matches existing API contract
        expect(result).toHaveProperty('issues');
        expect(result).toHaveProperty('totalIssueProduct');
        expect(result).toHaveProperty('totalIssueTechDebt');
        expect(result).toHaveProperty('productPercentage');
        expect(result).toHaveProperty('techDebtPercentage');
        expect(result).toHaveProperty('averageProductivity');

        // Validate calculated metrics are correct
        expect(result.totalIssueProduct).toBe(8);
        expect(result.totalIssueTechDebt).toBe(5);
        expect(result.productPercentage).toBe('61.54%');
        expect(result.techDebtPercentage).toBe('38.46%');

        // Validate individual member metrics
        const lekhaReport = result.issues.find(
          (issue) => issue.member === 'Lekha',
        );
        expect(lekhaReport).toBeDefined();
        expect(lekhaReport?.productPoint).toBe(8);
        expect(lekhaReport?.techDebtPoint).toBe(0);
        expect(lekhaReport?.totalPoint).toBe(8);
        expect(lekhaReport?.devDefect).toBe(0);

        const tasrifinReport = result.issues.find(
          (issue) => issue.member === 'Tasrifin',
        );
        expect(tasrifinReport).toBeDefined();
        expect(tasrifinReport?.productPoint).toBe(0);
        expect(tasrifinReport?.techDebtPoint).toBe(5);
        expect(tasrifinReport?.totalPoint).toBe(5);
        expect(tasrifinReport?.devDefect).toBe(1); // Bug issue type
      });

      it('should handle empty repository response correctly', async () => {
        mockRepository.fetchRawData.mockResolvedValue([]);

        const result = await service.generateReport('sprint-1', 'SLS');

        expect(result.totalIssueProduct).toBe(0);
        expect(result.totalIssueTechDebt).toBe(0);
        expect(result.productPercentage).toBe('0.00%');
        expect(result.techDebtPercentage).toBe('0.00%');
        expect(result.averageProductivity).toBe('0.00%');
        // Service creates report entries for all team members even when no issues exist
        expect(result.issues.length).toBeGreaterThan(0);
        // All entries should have zero values
        result.issues.forEach((issue) => {
          expect(issue.totalPoint).toBe(0);
          expect(issue.productPoint).toBe(0);
          expect(issue.techDebtPoint).toBe(0);
        });
      });
    });

    describe('processRawData() compatibility', () => {
      it('should handle same issue structure correctly from repository', async () => {
        const rawData: JiraIssueEntity[] = [
          createMockJiraIssueEntity({
            id: '10001',
            key: 'TEST-1',
            summary: 'Test Issue',
            fields: {
              summary: 'Test Issue',
              customfield_10005: 13,
              customfield_10796: {
                self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10001',
                value: 'SP Product',
                id: '10001',
              },
              customfield_10865: {
                self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10653',
                value: 'High',
                id: '10653',
              },
              customfield_11015: {
                self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10653',
                value: 'High',
                id: '10653',
              },
              assignee: {
                self: 'https://test.atlassian.net/rest/api/3/user?accountId=luqman',
                accountId: '712020:2fe52388-cf5e-4930-be5f-58495306745f',
                emailAddress: 'luqman.nugroho@amarbank.co.id',
                displayName: 'Luqman',
                active: true,
                timeZone: 'Asia/Jakarta',
                accountType: 'atlassian',
              },
              issuetype: {
                self: 'https://test.atlassian.net/rest/api/3/issuetype/10004',
                id: '10004',
                description: 'A task that needs to be done.',
                name: 'Story',
              },
            },
          }),
        ];

        mockRepository.fetchRawData.mockResolvedValue(rawData);

        const result = await service.generateReport('sprint-1', 'SLS');

        // Verify processRawData handles the issue structure correctly
        const luqmanReport = result.issues.find(
          (issue) => issue.member === 'Luqman',
        );
        expect(luqmanReport).toBeDefined();
        expect(luqmanReport?.productPoint).toBe(13);
        expect(luqmanReport?.totalPoint).toBe(13);
        expect(luqmanReport?.weightPointsProduct).toBe(8); // High complexity = 8 points
        expect(luqmanReport?.averageComplexity).toBe('0.10'); // 8 / 80 (senior level minimum)
      });

      it('should maintain team member mapping and filtering logic', async () => {
        // Test with assignee not in team
        const rawData: JiraIssueEntity[] = [
          createMockJiraIssueEntity({
            id: '10001',
            key: 'TEST-1',
            summary: 'Test Issue',
            fields: {
              summary: 'Test Issue',
              customfield_10005: 5,
              customfield_10796: {
                self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10001',
                value: 'SP Product',
                id: '10001',
              },
              customfield_10865: {
                self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10651',
                value: 'Low',
                id: '10651',
              },
              customfield_11015: {
                self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10651',
                value: 'Low',
                id: '10651',
              },
              assignee: {
                self: 'https://test.atlassian.net/rest/api/3/user?accountId=unknown',
                accountId: 'unknown-account-id',
                emailAddress: 'unknown@test.com',
                displayName: 'Unknown User',
                active: true,
                timeZone: 'Asia/Jakarta',
                accountType: 'atlassian',
              },
              issuetype: {
                self: 'https://test.atlassian.net/rest/api/3/issuetype/10004',
                id: '10004',
                description: 'A task that needs to be done.',
                name: 'Story',
              },
            },
          }),
        ];

        mockRepository.fetchRawData.mockResolvedValue(rawData);

        const result = await service.generateReport('sprint-1', 'SLS');

        // Unknown user should not appear in results
        expect(result.totalIssueProduct).toBe(0);
        expect(result.totalIssueTechDebt).toBe(0);
      });
    });

    describe('error handling propagation', () => {
      it('should propagate repository errors correctly to service layer', async () => {
        const repositoryError = new Error('Jira API connection failed');
        mockRepository.fetchRawData.mockRejectedValue(repositoryError);

        await expect(service.generateReport('sprint-1', 'SLS')).rejects.toThrow(
          'Jira API connection failed',
        );
      });

      it('should handle malformed data gracefully without breaking service', async () => {
        // Mock malformed data that might cause processing errors
        const malformedData: JiraIssueEntity[] = [
          createMockJiraIssueEntity({
            id: '10001',
            key: 'TEST-1',
            summary: 'Malformed Issue',
            fields: {
              summary: 'Malformed Issue',
              customfield_10005: 0,
              customfield_10796: {
                self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10001',
                value: 'SP Product',
                id: '10001',
              },
              customfield_10865: {
                self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10651',
                value: 'Low',
                id: '10651',
              },
              customfield_11015: {
                self: 'https://test.atlassian.net/rest/api/3/customFieldOption/10651',
                value: 'Low',
                id: '10651',
              },
              assignee: {
                self: 'https://test.atlassian.net/rest/api/3/user?accountId=null',
                accountId: null as unknown as string,
                emailAddress: 'null@test.com',
                displayName: 'Null User',
                active: true,
                timeZone: 'Asia/Jakarta',
                accountType: 'atlassian',
              },
              issuetype: {
                self: 'https://test.atlassian.net/rest/api/3/issuetype/10004',
                id: '10004',
                description: 'A task that needs to be done.',
                name: 'Story',
              },
            },
          }),
        ];

        mockRepository.fetchRawData.mockResolvedValue(malformedData);

        // Should not throw error, but handle gracefully
        const result = await service.generateReport('sprint-1', 'SLS');

        expect(result).toBeDefined();
        expect(result.totalIssueProduct).toBe(0);
        expect(result.totalIssueTechDebt).toBe(0);
      });
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
