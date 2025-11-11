# Requirements Document: Talent Leave API Enhancements

## Introduction

This spec enhances the existing talent-leave API with two key features:
1. **Team List Endpoint**: Expose a new API endpoint to fetch the list of teams from the `talent` Firestore collection, returning team names as strings
2. **Role Field Addition**: Add a `role` field (string type) to all talent-leave CRUD operations (create, update, view, delete)

These enhancements support the talent-leave UI by providing necessary data for team filtering and role display in the calendar view.

## Alignment with Product Vision

This feature supports the Krasnaya Ploshchad product vision by:
- **Data-Driven Decisions**: Provides team structure data to enable better leave management and capacity planning
- **Automated Reporting**: Expands the data model to include role information for more comprehensive team insights
- **Performance Visibility**: Enables filtering and grouping by team for better visibility into team availability

## Codebase Analysis Summary

### Existing Code to Leverage
- **Talent Leave Module**: Existing CRUD implementation at [apps/aioc-service/src/modules/talent-leave/](apps/aioc-service/src/modules/talent-leave/)
  - Controller, Service, Repository, DTOs, Entity interfaces already exist
  - Firestore integration pattern established in [talent-leave.repository.ts](apps/aioc-service/src/modules/talent-leave/repositories/talent-leave.repository.ts)
- **Team Data Source**: Team members defined in [team-member.const.ts](apps/aioc-service/src/shared/constants/team-member.const.ts)
  - Currently hardcoded with team constants: `TEAM_LENDING = 'SLS'`, `TEAM_FUNDING = 'DS'`
  - Each member has `team: string[]` array
- **Repository Pattern**: Follow existing Firestore repository pattern from talent-leave.repository.ts
- **Firestore Admin**: Firebase Admin SDK already configured at [firebase-admin.ts](apps/aioc-service/src/firebase/firebase-admin.ts)

### Data Structure Findings
- **Current talent-leave entity fields**: id, name, team, dateFrom, dateTo, status, createdAt, updatedAt
- **Missing field**: `role` (string) - needs to be added
- **Firestore collection**: `talent-leave` collection already exists
- **Talent collection**: Mentioned in requirements, needs to be verified or created in Firestore

## Requirements

### 1. Add Role Field to Talent Leave

#### 1.1 Update DTOs for Role Field
**User Story:** As a developer, I want the role field included in all DTOs, so that role information can be sent and received through the API.

WHEN creating a new talent leave record THEN the system SHALL accept a `role` field of type string in the request DTO.

WHEN updating a talent leave record THEN the system SHALL accept an optional `role` field of type string in the request DTO.

WHEN retrieving talent leave records THEN the system SHALL include the `role` field in the response DTO.

#### 1.2 Update Entity for Role Field
**User Story:** As a developer, I want the role field stored in the database entity, so that role information persists across operations.

WHEN defining the TalentLeaveEntity interface THEN the system SHALL include a `role` field of type string.

WHEN storing data in Firestore THEN the system SHALL persist the `role` field in the document.

#### 1.3 Update Create Operation
**User Story:** As a team manager, I want to specify a team member's role when creating a leave record, so that role information is captured.

WHEN a POST request is made to /talent-leave with a role field THEN the system SHALL validate that role is a non-empty string.

IF the role field is missing or empty THEN the system SHALL return a 400 Bad Request error with message "role is required".

WHEN validation passes THEN the system SHALL store the role value in the Firestore document.

#### 1.4 Update View Operations
**User Story:** As a team manager, I want to see the role field when viewing leave records, so that I can identify team member positions.

WHEN a GET request is made to /talent-leave THEN the system SHALL include the `role` field in each returned record.

WHEN a GET request is made to /talent-leave/:id THEN the system SHALL include the `role` field in the returned record.

IF a leave record in Firestore does not have a role field (legacy data) THEN the system SHALL return an empty string for the role field.

#### 1.5 Update Edit Operation
**User Story:** As a team manager, I want to update a team member's role, so that role information stays current.

WHEN a PUT request is made to /talent-leave/:id with a role field THEN the system SHALL validate that role is a non-empty string if provided.

IF the role field is provided and empty THEN the system SHALL return a 400 Bad Request error.

WHEN the role field is provided and valid THEN the system SHALL update the role value in the Firestore document.

WHEN the role field is not provided in the update request THEN the system SHALL leave the existing role value unchanged.

#### 1.6 Delete Operation (No Changes Required)
**User Story:** As a team manager, I want to delete leave records regardless of role, so that I can remove cancelled or erroneous entries.

WHEN a DELETE request is made to /talent-leave/:id THEN the system SHALL delete the entire document including the role field.

### 2. Team List Endpoint

#### 2.1 Create Teams Endpoint
**User Story:** As a frontend developer, I want to fetch a list of team names, so that I can populate team selection dropdowns and filter controls.

WHEN a GET request is made to /teams THEN the system SHALL return a list of unique team names as strings.

WHEN the teams endpoint is called THEN the system SHALL use the TalentLeaveController or create a new TeamsController under the talent-leave module.

#### 2.2 Fetch Teams from Firestore
**User Story:** As a system, I want to retrieve team names from the `talent` Firestore collection, so that team data is dynamically sourced.

WHEN fetching teams THEN the system SHALL query the `talent` Firestore collection.

IF the `talent` collection exists and contains documents with a `team` field THEN the system SHALL extract all unique team name values.

IF the `talent` collection does not exist or is empty THEN the system SHALL return an empty array.

#### 2.3 Team Response Format
**User Story:** As a frontend developer, I want a simple array of team name strings, so that I can easily use the data in UI components.

WHEN returning the team list THEN the system SHALL return a JSON array of strings.

WHEN multiple documents have the same team name THEN the system SHALL include each unique team name only once.

**Response Format:**
```json
["SLS", "DS", "Product", "Leaders"]
```

#### 2.4 Handle Talent Collection Structure
**User Story:** As a developer, I want the system to handle different talent collection structures, so that the API works regardless of schema variations.

WHEN reading from the `talent` collection THEN the system SHALL look for a field named `team` in each document.

IF a document's `team` field is a string THEN the system SHALL add it to the team list.

IF a document's `team` field is an array of strings THEN the system SHALL add each unique string to the team list.

IF a document does not have a `team` field THEN the system SHALL skip that document.

#### 2.5 Fallback to Hardcoded Teams
**User Story:** As a developer, I want a fallback to hardcoded team constants, so that the API returns data even if Firestore is unavailable.

IF the `talent` Firestore collection does not exist THEN the system SHALL return team names from the hardcoded constants (TEAM_LENDING, TEAM_FUNDING).

IF the Firestore query fails with an error THEN the system SHALL log the error and return hardcoded team names.

#### 2.6 Error Handling
**User Story:** As a developer, I want proper error handling, so that API failures are logged and don't crash the service.

WHEN a Firestore query error occurs THEN the system SHALL log the error with details.

WHEN an error occurs THEN the system SHALL return a 200 OK response with fallback team data (hardcoded teams).

IF a critical error prevents returning any data THEN the system SHALL return a 500 Internal Server Error with a descriptive message.

### 3. Repository Layer

#### 3.1 Create or Update Repository for Teams
**User Story:** As a developer, I want a repository method to fetch teams, so that data access logic is separated from business logic.

WHEN implementing the teams feature THEN the system SHALL create a new repository method `findAllTeams()` in TalentLeaveRepository or create a new TeamRepository.

WHEN `findAllTeams()` is called THEN it SHALL query the `talent` Firestore collection and return an array of unique team name strings.

#### 3.2 Update Repository for Role Field
**User Story:** As a developer, I want the repository to handle the role field, so that database operations include role data.

WHEN mapping Firestore documents to TalentLeaveEntity in the repository THEN the system SHALL include the `role` field.

WHEN the `role` field is missing from a Firestore document THEN the system SHALL default to an empty string.

WHEN creating or updating Firestore documents THEN the system SHALL include the `role` field in the data payload.

### 4. Service Layer

#### 4.1 Add Role Validation to Service
**User Story:** As a developer, I want role validation in the service layer, so that business rules are enforced consistently.

WHEN the service layer processes a create request THEN it SHALL ensure the `role` field is included in the entity.

WHEN the service layer processes an update request THEN it SHALL include the `role` field in the update data if provided.

#### 4.2 Create Teams Service Method
**User Story:** As a developer, I want a service method to fetch teams, so that business logic can be applied to team data.

WHEN implementing the teams feature THEN the system SHALL create a new service method `findAllTeams()` in TalentLeaveService or create a new TeamsService.

WHEN `findAllTeams()` is called THEN it SHALL call the repository method and return the team list.

IF the repository returns an empty list THEN the service SHALL return the fallback hardcoded teams.

### 5. Controller Layer

#### 5.1 Update Controller Validation for Role
**User Story:** As a developer, I want controller-level validation for the role field, so that invalid requests are rejected early.

WHEN the create endpoint receives a request THEN it SHALL validate that the `role` field is present and non-empty.

IF the `role` field is missing or empty THEN it SHALL throw a BadRequestException with message "role is required".

WHEN the update endpoint receives a request with a `role` field THEN it SHALL validate that it is non-empty.

#### 5.2 Create or Update Controller for Teams
**User Story:** As a developer, I want a controller endpoint for teams, so that the frontend can fetch team data.

WHEN implementing the teams endpoint THEN the system SHALL add a `@Get('teams')` method to TalentLeaveController or create a dedicated TeamsController.

WHEN a GET request is made to /talent-leave/teams or /teams THEN it SHALL call the service method and return the team list.

**Note:** If using TalentLeaveController, place the `@Get('teams')` route BEFORE the `@Get(':id')` route to avoid route conflicts.

### 6. Testing

#### 6.1 Unit Tests for Role Field
**User Story:** As a developer, I want unit tests for role field handling, so that the feature is verified and maintainable.

WHEN implementing role field support THEN the system SHALL add unit tests to:
- Controller: validate role field validation
- Service: test role field mapping in create/update
- Repository: test role field persistence and retrieval

#### 6.2 Unit Tests for Teams Endpoint
**User Story:** As a developer, I want unit tests for the teams endpoint, so that team data fetching is verified.

WHEN implementing the teams endpoint THEN the system SHALL add unit tests to:
- Repository: test `findAllTeams()` with mocked Firestore
- Service: test fallback to hardcoded teams
- Controller: test teams endpoint response format

#### 6.3 Integration Tests
**User Story:** As a developer, I want integration tests for the enhanced API, so that end-to-end functionality is verified.

WHEN completing the implementation THEN the system SHALL add integration tests for:
- Creating a leave record with role field
- Updating a leave record's role field
- Fetching leave records and verifying role field is returned
- Fetching teams and verifying response format

## Non-Functional Requirements

### Performance
- Teams endpoint should respond within 500ms under normal load
- Role field addition should not impact existing API response times
- Firestore queries should use appropriate indexing if needed

### Security
- Teams endpoint must require Firebase authentication (follow existing auth patterns)
- Role field must be validated to prevent injection attacks (string validation)
- Follow existing authorization patterns from TalentLeaveController

### Reliability
- Handle Firestore unavailability gracefully with fallback data
- Log all errors for debugging and monitoring
- Validate all input data to prevent invalid state

### Compatibility
- Existing leave records without role field should continue to work (backward compatibility)
- Role field should be returned as empty string for legacy data
- Teams endpoint should work even if `talent` collection doesn't exist yet

### Maintainability
- Follow existing NestJS module structure
- Use TypeScript strict mode for all new code
- Reuse existing patterns from TalentLeaveModule
- Add comprehensive JSDoc comments for new methods
- Ensure all code passes ESLint and Prettier checks

### Data Integrity
- Role field must be a non-empty string when provided
- Team names must be unique in the teams endpoint response
- Database updates must be atomic (no partial updates)
