import {
  JiraSearchResponseDto,
  JiraIssueDto,
  JiraSearchRequestDto,
  JiraIssueReportResponseDto,
  GetReportResponseDto,
} from './report.dto';
import { Level } from '../../../shared/enums/level.enum';

describe('Report DTOs', () => {
  describe('JiraSearchResponseDto', () => {
    it('should include isLast boolean field', () => {
      const response: JiraSearchResponseDto = {
        isLast: true,
        issues: [],
      };

      expect(response.isLast).toBe(true);
      expect(typeof response.isLast).toBe('boolean');
    });

    it('should include optional nextPageToken string field', () => {
      const responseWithToken: JiraSearchResponseDto = {
        isLast: false,
        nextPageToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9',
        issues: [],
      };

      const responseWithoutToken: JiraSearchResponseDto = {
        isLast: true,
        issues: [],
      };

      expect(responseWithToken.nextPageToken).toBe(
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9',
      );
      expect(typeof responseWithToken.nextPageToken).toBe('string');
      expect(responseWithoutToken.nextPageToken).toBeUndefined();
    });

    it('should NOT include deprecated fields: total, startAt, maxResults', () => {
      const response: JiraSearchResponseDto = {
        isLast: true,
        issues: [],
      };

      // These should not exist in the new interface
      expect('total' in response).toBe(false);
      expect('startAt' in response).toBe(false);
      expect('maxResults' in response).toBe(false);
    });

    it('should be instantiable with mock API response data', () => {
      const mockApiResponse: JiraSearchResponseDto = {
        isLast: false,
        nextPageToken: 'abc123token',
        issues: [
          {
            expand:
              'renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations',
            id: '10002',
            self: 'https://your-domain.atlassian.net/rest/api/3/issue/10002',
            key: 'ED-1',
            fields: {
              summary: 'Test Issue',
              customfield_10005: 5,
              customfield_10865: {
                self: 'https://your-domain.atlassian.net/rest/api/3/customFieldOption/10651',
                value: 'Low',
                id: '10651',
              },
              assignee: {
                self: 'https://your-domain.atlassian.net/rest/api/3/user?accountId=123',
                accountId: '123',
                emailAddress: 'test@example.com',
                displayName: 'Test User',
                active: true,
                timeZone: 'UTC',
                accountType: 'atlassian',
              },
              customfield_10796: {
                self: 'https://your-domain.atlassian.net/rest/api/3/customFieldOption/123',
                value: 'SP Product',
                id: '123',
              },
              customfield_11015: {
                self: 'https://your-domain.atlassian.net/rest/api/3/customFieldOption/10651',
                value: 'Low',
                id: '10651',
              },
              issuetype: {
                self: 'https://your-domain.atlassian.net/rest/api/3/issuetype/10001',
                id: '10001',
                description: 'A task that needs to be done.',
                name: 'Task',
              },
            },
          },
        ],
      };

      expect(mockApiResponse.isLast).toBe(false);
      expect(mockApiResponse.nextPageToken).toBe('abc123token');
      expect(mockApiResponse.issues).toHaveLength(1);
      expect(mockApiResponse.issues[0].key).toBe('ED-1');
    });

    it('should maintain backward compatibility with existing JiraIssueDto structure', () => {
      const issueDto: JiraIssueDto = {
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

      const response: JiraSearchResponseDto = {
        isLast: true,
        issues: [issueDto],
      };

      // Verify all expected fields are present
      expect(response.issues[0].id).toBe('10001');
      expect(response.issues[0].key).toBe('TEST-1');
      expect(response.issues[0].fields.summary).toBe('Test Issue Summary');
      expect(response.issues[0].fields.customfield_10005).toBe(8);
      expect(response.issues[0].fields.assignee.accountId).toBe('456');
    });
  });

  describe('Other DTOs remain unchanged', () => {
    it('should maintain JiraSearchRequestDto structure', () => {
      const request: JiraSearchRequestDto = {
        sprint: 'sprint-1',
        assignees: ['user1', 'user2'],
        project: 'TEST',
      };

      expect(request.sprint).toBe('sprint-1');
      expect(request.assignees).toEqual(['user1', 'user2']);
      expect(request.project).toBe('TEST');
    });

    it('should maintain JiraIssueReportResponseDto structure', () => {
      const report: JiraIssueReportResponseDto = {
        member: 'John Doe',
        productivityRate: '75.00%',
        devDefect: 1,
        devDefectRate: '100%',
        totalWeightPoints: 20,
        level: Level.Senior,
        weightPointsProduct: 15,
        weightPointsTechDebt: 5,
        targetWeightPoints: 80,
        issueKeys: ['SLS-101', 'SLS-102'],
      };

      expect(report.member).toBe('John Doe');
      expect(report.totalWeightPoints).toBe(20);
      expect(report.level).toBe(Level.Senior);
    });

    it('should maintain GetReportResponseDto structure', () => {
      const response: GetReportResponseDto = {
        issues: [],
        totalWeightPointsProduct: 100,
        totalWeightPointsTechDebt: 20,
        productPercentage: '83.33%',
        techDebtPercentage: '16.67%',
        averageProductivity: '80.00%',
      };

      expect(response.totalWeightPointsProduct).toBe(100);
      expect(response.totalWeightPointsTechDebt).toBe(20);
      expect(response.productPercentage).toBe('83.33%');
    });
  });

  describe('TypeScript compilation', () => {
    it('should compile without type errors', () => {
      // This test passes if TypeScript compilation succeeds
      const response: JiraSearchResponseDto = {
        isLast: true,
        issues: [],
      };

      const responseWithToken: JiraSearchResponseDto = {
        isLast: false,
        nextPageToken: 'token123',
        issues: [],
      };

      // If this compiles, the interfaces are correctly typed
      expect(response.isLast).toBeDefined();
      expect(responseWithToken.nextPageToken).toBeDefined();
    });
  });
});
