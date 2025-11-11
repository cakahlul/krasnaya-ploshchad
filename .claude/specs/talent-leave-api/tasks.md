# Implementation Plan: Talent Leave API Enhancements

## TDD Workflow Notice
**IMPORTANT**: All tasks follow Test-Driven Development. Tests are required before implementation.

## Task Overview

This implementation adds two enhancements to the existing talent-leave API module:
1. **Role field addition**: Add `role` string field to all CRUD operations (create, read, update, delete)
2. **Teams endpoint**: New GET `/talent-leave/teams` endpoint to fetch unique team names from Firestore

Both enhancements will be implemented within the existing `TalentLeaveModule` following NestJS patterns with comprehensive test coverage.

## Steering Document Compliance

- **Tech.md Alignment**:
  - NestJS with TypeScript (strict mode)
  - Jest for unit testing
  - Firebase Firestore using existing firebase-admin SDK
  - RESTful API architecture

- **Structure.md Compliance**:
  - Module location: `apps/aioc-service/src/modules/talent-leave/`
  - Controller → Service → Repository pattern
  - File naming: kebab-case
  - Tests: `.spec.ts` files alongside source files

- **Code Reuse**:
  - Existing TalentLeaveModule structure
  - Existing Firestore repository patterns
  - Team constants from `shared/constants/team-member.const.ts`
  - Firebase Admin SDK configuration

## Tasks

- [x] 1. Implement role field addition and teams endpoint for talent-leave API
  - **Test Specs**: Validate role field CRUD operations and teams endpoint functionality with backward compatibility
  - **Test Location**:
    - `apps/aioc-service/src/modules/talent-leave/talent-leave.controller.spec.ts`
    - `apps/aioc-service/src/modules/talent-leave/talent-leave.service.spec.ts`
    - `apps/aioc-service/src/modules/talent-leave/repositories/talent-leave.repository.spec.ts`

  - **Test Cases**:
    - **Controller Tests**:
      - Test POST /talent-leave rejects request without role field (400 Bad Request)
      - Test POST /talent-leave rejects request with empty role (400 Bad Request)
      - Test POST /talent-leave accepts request with valid role (201 Created)
      - Test PUT /talent-leave/:id rejects update with empty role if provided (400 Bad Request)
      - Test PUT /talent-leave/:id accepts update with valid role (200 OK)
      - Test PUT /talent-leave/:id accepts update without role field for partial update (200 OK)
      - Test GET /talent-leave/teams returns array of team names (200 OK)
      - Test GET /talent-leave/teams endpoint comes before /:id route (no route conflict)

    - **Service Tests**:
      - Test create() includes role in created entity
      - Test update() updates role field when provided
      - Test entityToDto() maps role field to DTO
      - Test entityToDto() defaults to empty string if role missing (backward compatibility)
      - Test findAllTeams() returns teams from repository
      - Test findAllTeams() returns fallback teams ['SLS', 'DS'] if repository returns empty
      - Test findAllTeams() returns fallback teams on error

    - **Repository Tests**:
      - Test create() persists role field to Firestore document
      - Test findAll() maps role field from Firestore
      - Test findAll() defaults role to empty string if missing (legacy data handling)
      - Test findById() maps role field from Firestore
      - Test findById() defaults role to empty string if missing
      - Test update() includes role field in update payload when provided
      - Test findAllTeams() returns unique team names from 'talent' collection
      - Test findAllTeams() handles string team fields
      - Test findAllTeams() handles array team fields and flattens them
      - Test findAllTeams() skips documents without team field
      - Test findAllTeams() returns empty array if 'talent' collection is empty
      - Test findAllTeams() throws InternalServerErrorException on Firestore failure

  - **Acceptance**:
    - All unit tests pass with >90% coverage
    - Role field is persisted and retrieved correctly in all CRUD operations
    - Legacy data without role field returns empty string without errors
    - Teams endpoint returns unique sorted team names or fallback ['SLS', 'DS']
    - Route order prevents /teams from being matched as /:id
    - All linting passes (ESLint + Prettier)

  - **Implementation Steps**:

    ### Step 1: Update DTOs (interfaces/talent-leave.dto.ts)
    - Add `role: string` to `CreateTalentLeaveDto` interface
    - Add `role?: string` to `UpdateTalentLeaveDto` interface
    - Add `role: string` to `TalentLeaveResponseDto` interface
    - Document the role field with JSDoc comments

    ### Step 2: Update Entity (interfaces/talent-leave.entity.ts)
    - Add `role: string` to `TalentLeaveEntity` interface
    - Document the role field purpose

    ### Step 3: Write Repository Tests (repositories/talent-leave.repository.spec.ts)
    - Add test suite for role field: "role field handling"
      - Test "should persist role field to Firestore when creating"
      - Test "should map role field from Firestore in findAll"
      - Test "should default role to empty string if missing in findAll"
      - Test "should map role field from Firestore in findById"
      - Test "should default role to empty string if missing in findById"
      - Test "should include role in update payload when provided"
    - Add test suite for findAllTeams: "findAllTeams method"
      - Test "should return unique team names from talent collection"
      - Test "should handle string team field"
      - Test "should handle array team field and flatten"
      - Test "should skip documents without team field"
      - Test "should return empty array if collection empty"
      - Test "should throw error on Firestore failure"
    - Mock Firestore snapshot responses with and without role field
    - Mock 'talent' collection documents with various team field formats

    ### Step 4: Update Repository (repositories/talent-leave.repository.ts)
    - **Import constants** at top of file:
      ```typescript
      import { InternalServerErrorException } from '@nestjs/common';
      ```
    - **Update create() method**:
      - Ensure `role` field is included when writing to Firestore (already in data parameter)
      - Add role field mapping when reading created document:
        ```typescript
        role: docData.role || '',
        ```
    - **Update findAll() method**:
      - Add role field mapping in snapshot.docs.map():
        ```typescript
        role: data.role || '',
        ```
    - **Update findById() method**:
      - Add role field mapping in return statement:
        ```typescript
        role: data.role || '',
        ```
    - **Update update() method**:
      - Role field will be in data parameter if provided (no changes needed)
      - Add role field mapping when reading updated document:
        ```typescript
        role: updatedData.role || '',
        ```
    - **Add findAllTeams() method**:
      ```typescript
      async findAllTeams(): Promise<string[]> {
        try {
          const snapshot = await this.firestore.collection('talent').get();

          if (snapshot.empty) {
            return [];
          }

          const teamSet = new Set<string>();

          snapshot.docs.forEach(doc => {
            const data = doc.data();
            const team = data.team;

            if (typeof team === 'string' && team.trim() !== '') {
              teamSet.add(team.trim());
            } else if (Array.isArray(team)) {
              team.forEach(t => {
                if (typeof t === 'string' && t.trim() !== '') {
                  teamSet.add(t.trim());
                }
              });
            }
          });

          return Array.from(teamSet).sort();
        } catch (error) {
          console.error('Failed to fetch teams from Firestore:', error);
          throw new InternalServerErrorException('Failed to fetch teams');
        }
      }
      ```

    ### Step 5: Write Service Tests (talent-leave.service.spec.ts)
    - Add test suite for role field: "role field operations"
      - Test "should include role in created entity"
      - Test "should include role in update data when provided"
      - Test "should not include role in update data when not provided"
      - Test "should map role field in entityToDto"
      - Test "should default role to empty string in entityToDto if undefined"
    - Add test suite for teams: "findAllTeams method"
      - Test "should return teams from repository"
      - Test "should return fallback teams if repository returns empty array"
      - Test "should return fallback teams on repository error"
    - Mock repository responses with and without role field
    - Mock repository.findAllTeams() with various scenarios

    ### Step 6: Update Service (talent-leave.service.ts)
    - **Import team constants** at top of file:
      ```typescript
      import { TEAM_LENDING, TEAM_FUNDING } from '../../shared/constants/team-member.const';
      ```
    - **Update create() method**:
      - Add role to entity construction:
        ```typescript
        const entity: TalentLeaveEntity = {
          name: dto.name,
          team: dto.team,
          dateFrom: new Date(dto.dateFrom),
          dateTo: new Date(dto.dateTo),
          status: dto.status,
          role: dto.role,  // ADD THIS LINE
          createdAt: now,
          updatedAt: now,
        };
        ```
    - **Update update() method**:
      - Add role to updateData if provided:
        ```typescript
        if (dto.role !== undefined) updateData.role = dto.role;
        ```
    - **Update entityToDto() method**:
      - Add role field mapping with fallback:
        ```typescript
        return {
          id: entity.id!,
          name: entity.name,
          team: entity.team,
          dateFrom: entity.dateFrom.toISOString(),
          dateTo: entity.dateTo.toISOString(),
          status: entity.status,
          role: entity.role || '',  // ADD THIS LINE with fallback
          createdAt: entity.createdAt.toISOString(),
          updatedAt: entity.updatedAt.toISOString(),
        };
        ```
    - **Add findAllTeams() method**:
      ```typescript
      async findAllTeams(): Promise<string[]> {
        try {
          const teams = await this.repository.findAllTeams();

          // If no teams found, return hardcoded fallback
          if (teams.length === 0) {
            return [TEAM_LENDING, TEAM_FUNDING];
          }

          return teams;
        } catch (error) {
          console.error('Service error fetching teams:', error);
          // Return fallback on error
          return [TEAM_LENDING, TEAM_FUNDING];
        }
      }
      ```

    ### Step 7: Write Controller Tests (talent-leave.controller.spec.ts)
    - Add test suite for role validation: "POST /talent-leave with role field"
      - Test "should return 400 if role field is missing"
      - Test "should return 400 if role field is empty string"
      - Test "should create leave record when role is valid"
    - Add test suite for role update: "PUT /talent-leave/:id with role field"
      - Test "should return 400 if role is empty string when provided"
      - Test "should update role when valid role provided"
      - Test "should allow update without role field (partial update)"
    - Add test suite for teams endpoint: "GET /talent-leave/teams"
      - Test "should return array of team names"
      - Test "should return teams from service"
    - Mock service responses

    ### Step 8: Update Controller (talent-leave.controller.ts)
    - **CRITICAL: Reorder routes** to place specific routes before parameterized routes:
      1. Move `@Get('teams')` (NEW) to top, right after class declaration
      2. Keep `@Post()`
      3. Keep `@Get()` (findAll with no params)
      4. Keep `@Get(':id')` AFTER `@Get('teams')`
      5. Keep `@Put(':id')`
      6. Keep `@Delete(':id')`
    - **Add teams endpoint** (place at top of controller, before other @Get methods):
      ```typescript
      @Get('teams')
      @HttpCode(HttpStatus.OK)
      async getTeams(): Promise<string[]> {
        return this.service.findAllTeams();
      }
      ```
    - **Update create() method** - add role validation after status validation:
      ```typescript
      if (!dto.role || dto.role.trim() === '') {
        throw new BadRequestException('role is required');
      }
      ```
    - **Update update() method** - add role validation after existing validation:
      ```typescript
      // Add after status validation, before dateFrom validation
      if (dto.role !== undefined && dto.role.trim() === '') {
        throw new BadRequestException('role cannot be empty');
      }
      ```

    ### Step 9: Run All Tests
    - Run unit tests for talent-leave module:
      ```bash
      npm test -- apps/aioc-service/src/modules/talent-leave
      ```
    - Verify all tests pass
    - Check test coverage meets threshold

    ### Step 10: Run Linting
    - Run ESLint check:
      ```bash
      npm run lint
      ```
    - Fix any linting errors:
      ```bash
      npm run lint -- --fix
      ```
    - Ensure all code passes linting

    ### Step 11: Manual Testing (Optional)
    - Start development server: `npm run dev`
    - Test POST /talent-leave with role field using curl or Postman
    - Test GET /talent-leave/:id returns role field
    - Test GET /talent-leave returns role in all records
    - Test PUT /talent-leave/:id with role update
    - Test GET /talent-leave/teams returns team list
    - Verify route /talent-leave/teams doesn't conflict with /:id

  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 6.3_

  - _Leverage:_
    - Existing TalentLeaveModule structure (Controller, Service, Repository)
    - Existing Firestore repository patterns from `talent-leave.repository.ts`
    - Team constants from `shared/constants/team-member.const.ts` (TEAM_LENDING='SLS', TEAM_FUNDING='DS')
    - Firebase Admin SDK already configured at `firebase/firebase-admin.ts`
    - Existing test patterns from `talent-leave.*.spec.ts` files
    - Existing validation patterns from `talent-leave.controller.ts`
    - NestJS decorators and exception classes
