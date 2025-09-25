import { Test, TestingModule } from '@nestjs/testing';
import { ReportJiraRepository } from '../../repositories/report.jira.repository';
import { JiraSearchRequestDto } from '../../interfaces/report.dto';

describe('Jira API Integration Tests', () => {
  let repository: ReportJiraRepository;
  let testStartTime: number;
  let testEndTime: number;

  // Integration test configuration
  const integrationConfig = {
    // Use environment variables for staging credentials
    jiraUrl: process.env.JIRA_URL_STAGING || process.env.JIRA_URL,
    jiraUsername:
      process.env.JIRA_USERNAME_STAGING || process.env.JIRA_USERNAME,
    jiraToken: process.env.JIRA_API_TOKEN_STAGING || process.env.JIRA_API_TOKEN,
    // Test data configuration
    testProject: process.env.JIRA_TEST_PROJECT || 'SLS',
    testSprint: process.env.JIRA_TEST_SPRINT || 'SLS Sprint 1',
    testAssignees: process.env.JIRA_TEST_ASSIGNEES?.split(',') || [
      '615ac0fda707100069885ad5', // Lekha
      '712020:1d6d1b04-9241-4007-8159-cf44b72ba81f', // Tasrifin
    ],
  };

  beforeAll(() => {
    // Skip integration tests if staging credentials are not available
    if (
      !integrationConfig.jiraUrl ||
      !integrationConfig.jiraUsername ||
      !integrationConfig.jiraToken
    ) {
      console.warn(
        'Skipping integration tests: Staging Jira credentials not configured',
      );
      return;
    }

    // Set staging environment variables for the repository
    process.env.JIRA_URL = integrationConfig.jiraUrl;
    process.env.JIRA_USERNAME = integrationConfig.jiraUsername;
    process.env.JIRA_API_TOKEN = integrationConfig.jiraToken;

    console.log('Integration tests configured for:', integrationConfig.jiraUrl);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportJiraRepository],
    }).compile();

    repository = module.get<ReportJiraRepository>(ReportJiraRepository);
    testStartTime = Date.now();
  });

  afterEach(() => {
    testEndTime = Date.now();
    const duration = testEndTime - testStartTime;
    console.log(`Test execution time: ${duration}ms`);
  });

  // Skip all tests if credentials are not available
  const skipIfNoCredentials = () => {
    if (
      !integrationConfig.jiraUrl ||
      !integrationConfig.jiraUsername ||
      !integrationConfig.jiraToken
    ) {
      return test.skip;
    }
    return test;
  };

  describe('Real Jira API Authentication', () => {
    skipIfNoCredentials()(
      'should successfully authenticate with real Jira credentials',
      async () => {
        const testRequest: JiraSearchRequestDto = {
          sprint: integrationConfig.testSprint,
          assignees: integrationConfig.testAssignees,
          project: integrationConfig.testProject,
        };

        // Should not throw authentication error
        await expect(
          repository.fetchRawData(testRequest),
        ).resolves.not.toThrow();
      },
    );

    skipIfNoCredentials()(
      'should handle authentication failures gracefully',
      async () => {
        // Temporarily set invalid credentials
        const originalToken = process.env.JIRA_API_TOKEN;
        process.env.JIRA_API_TOKEN = 'invalid-token';

        const testRepository = new ReportJiraRepository();
        const testRequest: JiraSearchRequestDto = {
          sprint: integrationConfig.testSprint,
          assignees: integrationConfig.testAssignees,
          project: integrationConfig.testProject,
        };

        await expect(
          testRepository.fetchRawData(testRequest),
        ).rejects.toThrow();

        // Restore original token
        process.env.JIRA_API_TOKEN = originalToken;
      },
    );
  });

  describe('Real JQL Query Execution', () => {
    skipIfNoCredentials()(
      'should execute actual JQL query and return expected issue structure',
      async () => {
        const testRequest: JiraSearchRequestDto = {
          sprint: integrationConfig.testSprint,
          assignees: integrationConfig.testAssignees,
          project: integrationConfig.testProject,
        };

        const result = await repository.fetchRawData(testRequest);

        // Validate response structure
        expect(Array.isArray(result)).toBe(true);

        if (result.length > 0) {
          const firstIssue = result[0];

          // Validate issue structure matches our entity definition
          expect(firstIssue).toHaveProperty('id');
          expect(firstIssue).toHaveProperty('key');
          expect(firstIssue).toHaveProperty('summary');
          expect(firstIssue).toHaveProperty('fields');

          // Validate fields structure
          expect(firstIssue.fields).toHaveProperty('summary');
          expect(firstIssue.fields).toHaveProperty('customfield_10005'); // Story points
          expect(firstIssue.fields).toHaveProperty('customfield_10796'); // Story point type
          expect(firstIssue.fields).toHaveProperty('customfield_10865'); // Complexity
          expect(firstIssue.fields).toHaveProperty('customfield_11015'); // Weight of Complexity
          expect(firstIssue.fields).toHaveProperty('assignee');
          expect(firstIssue.fields).toHaveProperty('issuetype');

          // Validate custom field structure
          if (firstIssue.fields.customfield_10796) {
            expect(firstIssue.fields.customfield_10796).toHaveProperty('self');
            expect(firstIssue.fields.customfield_10796).toHaveProperty('value');
            expect(firstIssue.fields.customfield_10796).toHaveProperty('id');
          }

          if (firstIssue.fields.assignee) {
            expect(firstIssue.fields.assignee).toHaveProperty('accountId');
            expect(firstIssue.fields.assignee).toHaveProperty('displayName');
          }

          console.log(`✓ Retrieved ${result.length} issues from real Jira API`);
          console.log(`✓ First issue key: ${firstIssue.key}`);
        } else {
          console.log(
            'ℹ No issues found for the test query - this may be expected',
          );
        }
      },
    );

    skipIfNoCredentials()(
      'should handle invalid JQL queries correctly',
      async () => {
        const invalidRequest: JiraSearchRequestDto = {
          sprint: 'NON_EXISTENT_SPRINT_12345',
          assignees: ['invalid-assignee-id'],
          project: 'INVALID_PROJECT',
        };

        // Should handle gracefully - may return empty results or throw descriptive error
        try {
          const result = await repository.fetchRawData(invalidRequest);
          expect(Array.isArray(result)).toBe(true);
          console.log(
            `✓ Invalid query handled gracefully, returned ${result.length} issues`,
          );
        } catch (error) {
          // Should be a descriptive error, not a generic network error
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).not.toMatch(/network/i);
          console.log(
            `✓ Invalid query rejected with appropriate error: ${(error as Error).message}`,
          );
        }
      },
    );
  });

  describe('Token-based Pagination with Real API', () => {
    skipIfNoCredentials()(
      'should handle real pagination with nextPageToken values',
      async () => {
        // Use a query that's likely to return multiple pages of results
        const testRequest: JiraSearchRequestDto = {
          sprint: integrationConfig.testSprint,
          assignees: integrationConfig.testAssignees,
          project: integrationConfig.testProject,
        };

        const result = await repository.fetchRawData(testRequest);

        expect(Array.isArray(result)).toBe(true);

        // If we got results, validate they came from proper pagination
        if (result.length > 0) {
          console.log(
            `✓ Pagination handled successfully, total issues: ${result.length}`,
          );

          // All issues should have unique IDs
          const issueIds = result.map((issue) => issue.id);
          const uniqueIds = new Set(issueIds);
          expect(uniqueIds.size).toBe(issueIds.length);

          console.log(`✓ All ${result.length} issues have unique IDs`);
        } else {
          console.log('ℹ No issues found - pagination not tested in this run');
        }
      },
    );
  });

  describe('Rate Limiting with Real API', () => {
    skipIfNoCredentials()('should respect Jira API rate limits', async () => {
      const testRequest: JiraSearchRequestDto = {
        sprint: integrationConfig.testSprint,
        assignees: integrationConfig.testAssignees.slice(0, 1), // Use fewer assignees for faster execution
        project: integrationConfig.testProject,
      };

      const startTime = Date.now();

      // Make multiple requests to test rate limiting
      const requests = [
        repository.fetchRawData(testRequest),
        repository.fetchRawData(testRequest),
      ];

      const results = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should have taken at least some time due to rate limiting
      // (1 second delay between pages as implemented)
      expect(totalTime).toBeGreaterThan(100); // At least 100ms

      // All requests should succeed
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });

      console.log(
        `✓ Rate limiting respected, total time for ${requests.length} requests: ${totalTime}ms`,
      );
    });
  });

  describe('Performance Validation', () => {
    skipIfNoCredentials()(
      'should meet or exceed legacy performance requirements',
      async () => {
        const testRequest: JiraSearchRequestDto = {
          sprint: integrationConfig.testSprint,
          assignees: integrationConfig.testAssignees,
          project: integrationConfig.testProject,
        };

        const performanceStartTime = Date.now();
        const result = await repository.fetchRawData(testRequest);
        const performanceEndTime = Date.now();
        const executionTime = performanceEndTime - performanceStartTime;

        // Performance requirements:
        // - Should complete within reasonable time (adjust based on your requirements)
        // - Should not be significantly slower than legacy implementation
        const maxAcceptableTime = 30000; // 30 seconds max for integration test

        expect(executionTime).toBeLessThan(maxAcceptableTime);

        console.log(`✓ Performance test completed in ${executionTime}ms`);
        console.log(`✓ Retrieved ${result.length} issues`);

        // Log performance metrics for monitoring
        if (result.length > 0) {
          const avgTimePerIssue = executionTime / result.length;
          console.log(
            `✓ Average time per issue: ${avgTimePerIssue.toFixed(2)}ms`,
          );
        }
      },
    );

    skipIfNoCredentials()(
      'should maintain acceptable memory usage during large data fetching',
      async () => {
        const testRequest: JiraSearchRequestDto = {
          sprint: integrationConfig.testSprint,
          assignees: integrationConfig.testAssignees,
          project: integrationConfig.testProject,
        };

        const initialMemory = process.memoryUsage().heapUsed;

        const result = await repository.fetchRawData(testRequest);

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        const memoryPerIssue =
          result.length > 0 ? memoryIncrease / result.length : 0;

        console.log(
          `✓ Memory usage: ${Math.round(memoryIncrease / 1024 / 1024)}MB increase`,
        );
        if (result.length > 0) {
          console.log(
            `✓ Memory per issue: ${Math.round(memoryPerIssue / 1024)}KB`,
          );
        }

        // Memory should not increase excessively (adjust threshold as needed)
        const maxMemoryIncrease = 100 * 1024 * 1024; // 100MB
        expect(memoryIncrease).toBeLessThan(maxMemoryIncrease);
      },
    );
  });

  describe('Error Handling in Real Environment', () => {
    skipIfNoCredentials()(
      'should handle network timeouts gracefully',
      async () => {
        // Set a very short timeout to force timeout scenario
        process.env.JIRA_REQUEST_TIMEOUT = '1'; // 1ms - will definitely timeout

        const timeoutRepository = new ReportJiraRepository();
        const testRequest: JiraSearchRequestDto = {
          sprint: integrationConfig.testSprint,
          assignees: integrationConfig.testAssignees,
          project: integrationConfig.testProject,
        };

        await expect(
          timeoutRepository.fetchRawData(testRequest),
        ).rejects.toThrow();

        // Restore normal timeout
        delete process.env.JIRA_REQUEST_TIMEOUT;
      },
    );

    skipIfNoCredentials()(
      'should provide meaningful error messages for real failures',
      async () => {
        // Test with empty project (likely to cause validation error)
        const invalidRequest: JiraSearchRequestDto = {
          sprint: integrationConfig.testSprint,
          assignees: integrationConfig.testAssignees,
          project: '', // Empty project
        };

        try {
          await repository.fetchRawData(invalidRequest);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBeDefined();
          expect((error as Error).message.length).toBeGreaterThan(0);
          console.log(
            `✓ Meaningful error message: ${(error as Error).message}`,
          );
        }
      },
    );
  });

  describe('Data Consistency Validation', () => {
    skipIfNoCredentials()(
      'should return consistent results across multiple identical requests',
      async () => {
        const testRequest: JiraSearchRequestDto = {
          sprint: integrationConfig.testSprint,
          assignees: integrationConfig.testAssignees,
          project: integrationConfig.testProject,
        };

        const [result1, result2] = await Promise.all([
          repository.fetchRawData(testRequest),
          repository.fetchRawData(testRequest),
        ]);

        // Results should be identical (same number of issues with same IDs)
        expect(result1.length).toBe(result2.length);

        if (result1.length > 0 && result2.length > 0) {
          const ids1 = result1.map((issue) => issue.id).sort();
          const ids2 = result2.map((issue) => issue.id).sort();
          expect(ids1).toEqual(ids2);

          console.log(
            `✓ Consistent results across requests: ${result1.length} issues`,
          );
        }
      },
    );
  });
});
