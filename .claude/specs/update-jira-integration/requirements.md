# Requirements - Update Jira Integration

## Feature: Update Jira Integration

### Context
The current Jira integration uses the **DEPRECATED** `/rest/api/3/search` endpoint which is being removed by Atlassian. The system is currently unable to access this endpoint, requiring immediate migration to the new `GET /rest/api/3/search/jql` endpoint. **CRITICAL**: This migration involves significant breaking changes including a complete rewrite of the pagination system from offset-based to token-based pagination.

## Codebase Analysis Summary

### Current Implementation:
- **Repository**: `ReportJiraRepository` in `/apps/aioc-service/src/modules/reports/repositories/report.jira.repository.ts`
- **Service**: `ReportsService` in `/apps/aioc-service/src/modules/reports/reports.service.ts` 
- **Current Endpoint**: `/rest/api/3/search` with JQL queries
- **Authentication**: Basic auth (username + API token)
- **Rate Limiting**: 1 second delay between requests (1 req/sec)
- **Pagination**: Supports pagination with 100 results per request
- **Custom Fields**: Fetches story points, complexity, assignee, issue type
- **Data Processing**: Transforms raw Jira data into team performance metrics

### Existing Patterns Available for Reuse:
- **NestJS Module Structure**: Reports module follows standard NestJS patterns
- **Repository Pattern**: Clean separation between data access and business logic
- **DTO/Entity Interfaces**: Well-defined TypeScript interfaces for API contracts
- **Error Handling**: Basic try-catch patterns exist but need enhancement
- **Environment Configuration**: Uses environment variables for credentials

### Breaking Changes Identified
Based on the official Atlassian documentation:

**Current Deprecated Endpoint:**
```typescript
GET /rest/api/3/search?jql=...&startAt=0&maxResults=100
Response: { total: 100, startAt: 0, maxResults: 100, issues: [...] }
```

**New Endpoint:**  
```typescript
GET /rest/api/3/search/jql?jql=...&nextPageToken=&maxResults=100
Response: { isLast: true, issues: [...], nextPageToken?: "abc123" }
```

**Critical Changes:**
- ❌ **Removed**: `total`, `startAt`, `maxResults` from response
- ✅ **Added**: `isLast` boolean, `nextPageToken` for pagination
- 🔄 **Changed**: Pagination logic from offset-based to token-based

## Requirements

### Requirement 1: **CRITICAL** - API Endpoint Migration with Breaking Changes
**User Story:** As a backend developer, I want to migrate from the deprecated `/rest/api/3/search` endpoint to the new `GET /rest/api/3/search/jql` endpoint, so that our system can function again and reports can be generated.

#### Acceptance Criteria
1. WHEN the system makes Jira API calls THEN it SHALL use the endpoint `GET /rest/api/3/search/jql`
2. WHEN making requests THEN the system SHALL use query parameters: `jql`, `nextPageToken`, `maxResults`, `fields`, `expand`, `reconcileIssues`
3. WHEN the endpoint responds THEN the system SHALL handle the new response format with `isLast` and `nextPageToken` fields
4. WHEN processing responses THEN the system SHALL NOT rely on the removed fields: `total`, `startAt`, `maxResults`
5. WHEN the migration is complete THEN all existing report functionality SHALL work without interruption

### Requirement 2: Enhanced Error Handling and Resilience
**User Story:** As a team manager, I want the reporting system to be reliable and handle Jira API failures gracefully, so that I can still access reports even when there are temporary API issues.

#### Acceptance Criteria
1. WHEN Jira API calls fail THEN the system SHALL provide specific error messages indicating the type of failure
2. IF rate limits are exceeded THEN the system SHALL implement exponential backoff retry logic
3. WHEN network timeouts occur THEN the system SHALL retry with appropriate delays
4. IF authentication fails THEN the system SHALL provide clear authentication error messages
5. WHEN partial data is available THEN the system SHALL return available data with clear indicators of missing information

### Requirement 3: Improved Authentication and Security
**User Story:** As a security-conscious organization, I want our Jira integration to use the most secure authentication methods available, so that our API credentials are protected.

#### Acceptance Criteria
1. WHEN making API calls THEN the system SHALL use the most secure authentication method recommended by Atlassian
2. IF API tokens expire THEN the system SHALL provide clear error messages for credential renewal
3. WHEN storing credentials THEN the system SHALL ensure they are properly secured through environment variables
4. IF authentication methods change THEN the system SHALL be easily configurable for new auth approaches

### Requirement 6: Enhanced Rate Limiting and Performance
**User Story:** As a backend developer, I want our Jira integration to respect API rate limits while maximizing performance, so that we can fetch data efficiently without being blocked.

#### Acceptance Criteria
1. WHEN making multiple API calls THEN the system SHALL implement intelligent rate limiting
2. IF rate limits are approached THEN the system SHALL automatically adjust request timing
3. WHEN fetching large datasets THEN the system SHALL optimize token-based pagination strategies
4. IF concurrent requests are needed THEN the system SHALL manage them within rate limit constraints

### Requirement 2: **CRITICAL** - Token-Based Pagination System Rewrite
**User Story:** As a backend developer, I want to rewrite the pagination system to use token-based pagination instead of offset-based, so that the new Jira API works correctly.

#### Acceptance Criteria
1. WHEN fetching multiple pages THEN the system SHALL use `nextPageToken` instead of `startAt` parameter
2. WHEN processing responses THEN the system SHALL check `isLast` field to determine if more pages exist
3. WHEN a page has more results THEN the system SHALL extract and use the `nextPageToken` for the next request
4. WHEN the last page is reached THEN the system SHALL stop pagination when `isLast` is true
5. WHEN fetching the first page THEN the system SHALL omit `nextPageToken` parameter or pass it as empty

### Requirement 3: **CRITICAL** - Response Interface Updates
**User Story:** As a backend developer, I want to update all TypeScript interfaces to match the new API response format, so that the code is type-safe and compiles correctly.

#### Acceptance Criteria
1. WHEN updating interfaces THEN the system SHALL remove `total`, `startAt`, `maxResults` from `JiraSearchResponseDto`
2. WHEN updating interfaces THEN the system SHALL add `isLast: boolean` and optional `nextPageToken?: string` fields
3. WHEN the interfaces are updated THEN all existing code SHALL compile without TypeScript errors
4. WHEN processing responses THEN the system SHALL not reference the removed fields anywhere in the codebase
5. WHEN the interface changes are complete THEN the `issues` array structure SHALL remain the same

### Requirement 4: Enhanced Error Handling and Resilience
**User Story:** As a team manager, I want the reporting system to be reliable and handle Jira API failures gracefully, so that I can still access reports even when there are temporary API issues.

#### Acceptance Criteria
1. WHEN Jira API calls fail THEN the system SHALL provide specific error messages indicating the type of failure
2. IF rate limits are exceeded THEN the system SHALL implement exponential backoff retry logic
3. WHEN network timeouts occur THEN the system SHALL retry with appropriate delays
4. IF authentication fails THEN the system SHALL provide clear authentication error messages
5. WHEN partial data is available THEN the system SHALL return available data with clear indicators of missing information

### Requirement 5: Improved Data Validation and Type Safety
**User Story:** As a developer maintaining the system, I want strong type safety and validation for all Jira API responses, so that the system is robust against API changes.

#### Acceptance Criteria
1. WHEN receiving API responses THEN the system SHALL validate response structure against expected schemas
2. IF API response format changes THEN the system SHALL detect and handle the changes gracefully
3. WHEN processing custom fields THEN the system SHALL validate field existence and data types
4. IF required data is missing THEN the system SHALL provide meaningful error messages

### Requirement 7: Enhanced Logging and Monitoring
**User Story:** As a system administrator, I want comprehensive logging of Jira API interactions, so that I can troubleshoot issues and monitor system health.

#### Acceptance Criteria
1. WHEN making API calls THEN the system SHALL log request details (excluding sensitive data)
2. IF errors occur THEN the system SHALL log detailed error information for debugging
3. WHEN rate limits are hit THEN the system SHALL log rate limiting events
4. IF API responses are unexpected THEN the system SHALL log response validation failures

### Requirement 8: Configuration Flexibility
**User Story:** As a deployment engineer, I want flexible configuration options for the Jira integration, so that I can easily adjust settings for different environments.

#### Acceptance Criteria
1. WHEN deploying to different environments THEN the system SHALL support environment-specific configurations
2. IF API endpoints change THEN the configuration SHALL be easily updatable without code changes
3. WHEN adjusting rate limits THEN the configuration SHALL support dynamic rate limiting parameters
4. IF timeout values need adjustment THEN they SHALL be configurable through environment variables

### Requirement 9: Maintain Existing Functionality
**User Story:** As a team manager, I want all current reporting functionality to continue working after the Jira integration update, so that my workflow is not disrupted.

#### Acceptance Criteria
1. WHEN the update is complete THEN all existing report generation functionality SHALL work as before
2. IF data formats change THEN the system SHALL maintain backward compatibility for existing reports
3. WHEN new API responses are processed THEN the system SHALL extract the same metrics as before
4. IF performance improves THEN response times SHALL be equal or better than current implementation

## Technical Constraints
- Must follow existing NestJS patterns and conventions
- Must not break existing API contracts for the reports endpoint  
- Must maintain current security requirements for Jira data privacy
- Should improve error handling without changing successful response formats
- **BREAKING**: TypeScript interfaces MUST be updated to match new response format
- **BREAKING**: Pagination logic MUST be completely rewritten for token-based approach
- Must maintain same custom fields extraction: `customfield_10005`, `customfield_10796`, `customfield_10865`, `customfield_11015`

## Implementation Notes
- **Authentication**: Basic Auth with username + API token remains the same
- **Request Method**: GET method recommended to minimize code changes
- **Query Parameters**: `jql`, `maxResults`, `fields` remain the same; add `nextPageToken`, remove `startAt`  
- **Response Structure**: The `issues[]` array structure and content remain identical
- **Custom Fields**: All current custom field processing logic can be reused