# Implementation Plan - Update Jira Integration

## Task Overview
This implementation plan breaks down the critical Jira API migration into atomic, test-driven development tasks. The migration involves updating from the deprecated `/rest/api/3/search` endpoint to `GET /rest/api/3/search/jql` with token-based pagination. All tasks follow TDD principles with RED-GREEN-REFACTOR-VERIFY cycles.

**Critical Path:** Interface updates → Pagination rewrite → Error handling enhancement → Integration testing

## Steering Document Compliance

### Technical Standards (tech.md)
- **NestJS Framework**: All tasks maintain service/repository pattern with dependency injection
- **TypeScript**: Tasks enforce strict typing with updated interfaces
- **Jest Testing**: Each task includes comprehensive test specifications alongside source files
- **Environment Configuration**: Tasks leverage existing @nestjs/config patterns

### Project Structure (structure.md)
- **Module Organization**: Tasks keep changes within `src/modules/reports/` following NestJS conventions
- **File Naming**: All new files follow kebab-case convention
- **Import Organization**: External libraries → Internal modules → Relative imports
- **Interface Location**: DTOs and entities remain in `interfaces/` subdirectory

## Tasks

- [x] 1. Update TypeScript interfaces for new API response format
  - **Test Specs**: Validate new interfaces compile correctly and match actual API response structure
  - **Test Location**: `apps/aioc-service/src/modules/reports/interfaces/report.dto.spec.ts`
  - **Test Cases**:
    - Test `JiraSearchResponseDto` includes `isLast` boolean and optional `nextPageToken` string
    - Test `JiraSearchResponseDto` excludes deprecated `total`, `startAt`, `maxResults` fields
    - Test interface can be instantiated with mock API response data
    - Test backward compatibility with existing `JiraIssueDto` structure
    - Test TypeScript compilation succeeds with no type errors
  - **Acceptance**: All interface tests pass, TypeScript compiles without errors, interfaces match real API responses
  - **Implementation**: Follow TDD cycle - write interface tests first, then update DTOs to pass tests
  - Update `JiraSearchResponseDto` in `src/modules/reports/interfaces/report.dto.ts`
  - Remove: `total: number`, `startAt: number`, `maxResults: number` 
  - Add: `isLast: boolean`, `nextPageToken?: string`
  - Keep existing `issues: JiraIssueDto[]` unchanged
  - Create test fixtures with real API response examples
  - _Requirements: 1.3, 3.2_
  - _Leverage: apps/aioc-service/src/modules/reports/interfaces/report.dto.ts, existing JiraIssueDto structure_

- [x] 2. Implement token-based pagination logic in repository
  - **Test Specs**: Validate pagination handles single pages, multiple pages, and edge cases correctly
  - **Test Location**: `apps/aioc-service/src/modules/reports/repositories/report.jira.repository.spec.ts`
  - **Test Cases**:
    - Test single page response (isLast: true) stops pagination correctly  
    - Test multiple page response follows nextPageToken chain
    - Test empty nextPageToken on first request (omit parameter)
    - Test pagination stops when isLast becomes true
    - Test accumulates all issues across pages correctly
    - Test handles missing nextPageToken gracefully
    - Test rate limiting delay occurs between pages
  - **Acceptance**: All pagination tests pass, handles all documented response scenarios, preserves rate limiting
  - **Implementation**: Use TDD approach - write comprehensive pagination tests, then implement minimal code to pass
  - Replace offset-based pagination loop in `fetchRawData()` method
  - Implement: `let nextPageToken: string | undefined = undefined`
  - Implement: `let isLast = false` tracking
  - Implement: `do...while (!isLast)` loop structure  
  - Update axios request to include `nextPageToken` parameter when present
  - Extract `isLast` and `nextPageToken` from response for next iteration
  - Preserve existing rate limiting: `await new Promise(resolve => setTimeout(resolve, 1000))`
  - _Requirements: 1.1, 2.1, 2.2, 2.4_
  - _Leverage: apps/aioc-service/src/modules/reports/repositories/report.jira.repository.ts existing auth, rate limiting, transformIssues()_

- [x] 2.1. Update API endpoint URL and request parameters
  - **Test Specs**: Validate request uses correct endpoint and parameters for new API
  - **Test Location**: `apps/aioc-service/src/modules/reports/repositories/report.jira.repository.spec.ts`
  - **Test Cases**:
    - Test request URL uses `/rest/api/3/search/jql` endpoint
    - Test first request omits `nextPageToken` parameter
    - Test subsequent requests include `nextPageToken` from previous response
    - Test preserves existing parameters: `jql`, `maxResults`, `fields`, `validateQuery`
    - Test removes deprecated `startAt` parameter completely
  - **Acceptance**: All request parameter tests pass, endpoint URL updated correctly, parameter handling follows API spec
  - **Implementation**: Follow TDD - write request tests first, update URL and parameter logic to pass tests
  - Change `searchUrl` from `/rest/api/3/search` to `/rest/api/3/search/jql`
  - Remove `startAt` from axios params object
  - Add conditional `nextPageToken` parameter: `...(nextPageToken && { nextPageToken })`
  - Preserve all existing parameters: `jql`, `maxResults`, `fields`, `validateQuery`, `timeout`
  - _Requirements: 1.1, 1.2_
  - _Leverage: existing axios configuration, authentication, timeout settings_

- [x] 3. Add enhanced error handling with retry logic
  - **Test Specs**: Validate error classification, retry logic, and logging work correctly
  - **Test Location**: `apps/aioc-service/src/modules/reports/repositories/report.jira.repository.spec.ts`  
  - **Test Cases**:
    - Test authentication errors (401) fail fast without retries
    - Test rate limit errors (429) trigger exponential backoff retry
    - Test network timeout errors trigger retry with delay
    - Test successful retry after transient failure
    - Test max retry attempts reached throws final error
    - Test non-retryable errors fail immediately
    - Test error logging includes context and sanitized details
  - **Acceptance**: All error handling tests pass, proper error classification, retry logic follows configuration, sensitive data excluded from logs
  - **Implementation**: Use TDD cycle - write comprehensive error tests, implement error handling to satisfy tests
  - Wrap API calls in try-catch with error classification
  - Implement exponential backoff: `delay = baseDelay * Math.pow(2, attempt)`
  - Add retry logic for: network errors, timeouts, rate limits (429)
  - No retry for: authentication (401), authorization (403), validation (400)
  - Enhance error logging with context, exclude sensitive auth data
  - Add configurable retry attempts from environment variables
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - _Leverage: existing error handling patterns, NestJS Logger, process.env configuration_

- [x] 4. Add flexible configuration for new API settings
  - **Test Specs**: Validate configuration loads correctly and provides appropriate defaults
  - **Test Location**: `apps/aioc-service/src/modules/reports/repositories/report.jira.repository.spec.ts`
  - **Test Cases**:
    - Test loads JIRA_SEARCH_ENDPOINT from environment with default fallback
    - Test loads JIRA_MAX_RESULTS with default 100
    - Test loads JIRA_RATE_LIMIT_MS with default 1000
    - Test loads JIRA_REQUEST_TIMEOUT with default 30000
    - Test loads JIRA_RETRY_ATTEMPTS with default 3
    - Test configuration validates and handles invalid values gracefully
  - **Acceptance**: All configuration tests pass, environment variables loaded correctly, sensible defaults provided, invalid values handled
  - **Implementation**: Follow TDD approach - write configuration tests first, implement configuration loading logic
  - Add new environment variables to repository constructor
  - `JIRA_SEARCH_ENDPOINT`: default `/rest/api/3/search/jql`
  - `JIRA_MAX_RESULTS`: default `100`
  - `JIRA_RATE_LIMIT_MS`: default `1000` 
  - `JIRA_REQUEST_TIMEOUT`: default `30000`
  - `JIRA_RETRY_ATTEMPTS`: default `3`
  - Update hardcoded values to use configuration
  - Add validation for numeric configuration values
  - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - _Leverage: existing process.env usage, NestJS ConfigModule pattern_

- [x] 5. Implement comprehensive logging for API interactions
  - **Test Specs**: Validate logging captures appropriate details while excluding sensitive information
  - **Test Location**: `apps/aioc-service/src/modules/reports/repositories/report.jira.repository.spec.ts`
  - **Test Cases**:
    - Test successful API calls log request details (excluding auth tokens)
    - Test failed API calls log error details with context
    - Test rate limit hits log rate limiting events
    - Test pagination progress logs page counts and tokens (sanitized)
    - Test sensitive data (passwords, tokens) excluded from all logs
    - Test log levels appropriate for different scenarios (info, warn, error)
  - **Acceptance**: All logging tests pass, appropriate detail level, no sensitive data leaked, proper log levels used
  - **Implementation**: Use TDD cycle - write logging tests with mock logger, implement logging to satisfy tests
  - Add NestJS Logger to repository constructor
  - Log successful requests: `this.logger.log('Jira API request successful', { page: pageNum, issues: count })`
  - Log errors: `this.logger.error('Jira API error', { error: error.message, context })`
  - Log rate limiting: `this.logger.warn('Rate limit applied', { delay: delayMs })`
  - Sanitize URLs and tokens from log output
  - Use appropriate log levels: log(), warn(), error()
  - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - _Leverage: NestJS Logger pattern, existing error handling structure_

- [x] 6. Create comprehensive unit tests for repository changes
  - **Test Specs**: Validate complete repository functionality with high test coverage
  - **Test Location**: `apps/aioc-service/src/modules/reports/repositories/report.jira.repository.spec.ts`
  - **Test Cases**:
    - Test complete fetchRawData flow with mocked token-based responses
    - Test authentication using existing Basic auth pattern
    - Test custom field extraction remains unchanged
    - Test transformIssues() method still works with new response structure
    - Test error scenarios: network failures, auth failures, malformed responses
    - Test integration with team member mapping and filtering
    - Test rate limiting behavior between API calls
  - **Acceptance**: Repository tests achieve 95%+ coverage, all scenarios tested, existing functionality preserved
  - **Implementation**: Follow comprehensive TDD approach - write extensive test suite first, ensure repository passes all tests
  - Create mock responses matching new API format with `isLast` and `nextPageToken`
  - Mock axios.get to return sequential paginated responses
  - Test both single page and multi-page scenarios
  - Verify `transformIssues()` receives same issue structure as before
  - Test error injection at various points in pagination flow
  - Verify team member filtering and custom field extraction unchanged
  - Use Jest spies to verify rate limiting delays occur
  - _Requirements: 1.5, 9.1, 9.3_
  - _Leverage: existing test patterns, Jest mocking utilities, current transformIssues() logic_

- [x] 7. Validate service layer compatibility with repository changes
  - **Test Specs**: Ensure service layer continues to work correctly with updated repository
  - **Test Location**: `apps/aioc-service/src/modules/reports/reports.service.spec.ts`
  - **Test Cases**:
    - Test generateReport() produces identical results to legacy implementation
    - Test processRawData() handles same issue structure correctly
    - Test team member mapping and complexity calculations unchanged
    - Test final report format matches existing API contract
    - Test error handling propagates correctly from repository to service
  - **Acceptance**: All service tests pass, identical output to legacy system, no breaking changes to service API
  - **Implementation**: Use TDD approach - write service compatibility tests, verify no service changes needed
  - Run existing service tests to ensure they still pass
  - Add integration tests that mock new repository responses
  - Verify `JiraIssueEntity[]` return format unchanged from repository
  - Test that business logic produces same metrics calculations
  - Confirm final `GetReportResponseDto` format identical
  - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - _Leverage: existing ReportsService methods, business logic, team member constants_

- [ ] 8. Integration testing with real API endpoints
  - **Test Specs**: Validate integration works correctly with actual Jira API in staging environment
  - **Test Location**: `apps/aioc-service/src/modules/reports/tests/integration/jira-api.integration.spec.ts`
  - **Test Cases**:
    - Test successful authentication with real Jira credentials
    - Test actual JQL query returns expected issue structure
    - Test pagination works with real nextPageToken values
    - Test rate limiting respects Jira API limits
    - Test error handling with invalid JQL queries
    - Test performance meets or exceeds legacy implementation
  - **Acceptance**: Integration tests pass in staging environment, real API calls work correctly, performance acceptable
  - **Implementation**: Use TDD approach - write integration tests first, validate against staging Jira instance
  - Create integration test configuration with staging credentials
  - Test against known sprint data with predictable results
  - Measure and compare performance with legacy timing
  - Validate actual response structure matches interface definitions
  - Test real error scenarios (invalid project, expired credentials)
  - _Requirements: 1.5, 4.5, 6.4, 9.4_
  - _Leverage: existing staging environment setup, known test data sets_

- [x] 9. Update and verify all existing tests pass
  - **Test Specs**: Ensure all existing tests continue to pass after changes
  - **Test Location**: `apps/aioc-service/src/modules/reports/**/*.spec.ts`
  - **Test Cases**:
    - Test reports controller tests still pass with no changes needed
    - Test reports service tests pass with mock repository updates
    - Test all interface and entity tests pass with updated types
    - Test end-to-end report generation workflow produces identical results
    - Test performance regression tests show maintained or improved performance
  - **Acceptance**: All existing tests pass, no breaking changes detected, test suite maintains high coverage
  - **Implementation**: Run existing test suite, update mocks where needed to match new interfaces, verify no functionality regressions
  - Run full test suite: `npm run test apps/aioc-service`
  - Update test mocks to use new `JiraSearchResponseDto` format
  - Verify no controller or service logic changes needed
  - Update fixtures with `isLast` and `nextPageToken` fields
  - Ensure test coverage remains above 95%
  - Run performance comparisons with legacy implementation
  - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - _Leverage: existing test infrastructure, Jest configuration, test utilities_