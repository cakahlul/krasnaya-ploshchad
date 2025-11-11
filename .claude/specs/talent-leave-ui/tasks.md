# Implementation Plan: Talent Leave UI

## Task Overview

This implementation plan breaks down the Talent Leave UI feature into atomic, test-driven development (TDD) tasks. Each task follows the RED-GREEN-REFACTOR-VERIFY cycle and builds incrementally on previous work. The implementation leverages existing patterns from tere-project (React Query, Zustand, axiosClient, Ant Design) and follows Next.js 15 conventions.

**Implementation Strategy:**
- Phase 1: Foundation (types, utilities, store, repository)
- Phase 2: Data fetching hooks
- Phase 3: Core UI components
- Phase 4: CRUD operations
- Phase 5: Integration and polish

## Steering Document Compliance

### Technical Standards (tech.md)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS
- **State Management**: Zustand (client) + TanStack React Query (server)
- **UI Library**: Ant Design
- **Testing**: Jest + React Testing Library

### Project Structure (structure.md)
- **Features Organization**: `src/features/talent-leave/`
- **Component Structure**: components/, hooks/, store/, types/, repositories/, utils/
- **Testing**: Test files alongside source files
- **Naming Conventions**: kebab-case for files, PascalCase for components

## Tasks

- [x] 1. Set up feature directory structure and TypeScript interfaces
  - **Test Specs**: Validate that all TypeScript interfaces compile without errors and can be imported correctly
  - **Test Location**: `apps/tere-project/src/features/talent-leave/types/talent-leave.types.test.ts`
  - **Test Cases**:
    - Test that TalentLeaveResponse interface accepts valid API response
    - Test that TalentResponse interface accepts valid talent data
    - Test that CreateLeaveRequest interface enforces required fields
    - Test that UpdateLeaveRequest interface allows partial updates
    - Test that Holiday, CalendarCell, TeamGroup, LeaveRowData interfaces have correct shapes
  - **Acceptance**: All interfaces compile, imports work, type checking passes without errors
  - **Implementation**: Create directory structure following structure.md conventions, define all interfaces matching API contracts from design doc
  - Create directory: `apps/tere-project/src/features/talent-leave/`
  - Create subdirectories: components/, hooks/, store/, types/, repositories/, utils/
  - Create `types/talent-leave.types.ts` with all interfaces from design doc
  - _Requirements: All requirements (foundation for all features)_
  - _Leverage: src/features/dashboard/types/dashboard.ts for pattern reference_

- [x] 2. Implement date utility functions with comprehensive tests
  - **Test Specs**: Validate all date utility functions handle edge cases, timezones, and boundary conditions correctly
  - **Test Location**: `apps/tere-project/src/features/talent-leave/utils/dateUtils.test.ts`
  - **Test Cases**:
    - Test generateDateRange() produces correct number of dates for 2-month span
    - Test generateDateRange() correctly marks weekends (Saturday, Sunday)
    - Test generateDateRange() handles month boundaries correctly
    - Test isDateInLeaveRange() correctly identifies dates within range
    - Test isDateInLeaveRange() handles edge cases (same day, boundary dates)
    - Test calculateDayCount() returns accurate day count including start and end dates
    - Test formatDateRange() produces correct MM/DD/YYYY format
    - Test getIndonesianDayName() returns correct day names for all 7 days
    - Test disablePastDates() correctly disables dates before today
    - Test disableBeforeDate() correctly disables dates before specified date
  - **Acceptance**: All date utility tests pass, functions handle edge cases, no timezone issues
  - **Implementation**: Write tests first, implement minimal code to pass tests, refactor for clarity
  - Create `utils/dateUtils.ts` with all functions from design doc
  - Use date-fns or native Date API for date manipulation
  - Ensure timezone consistency (use UTC or local consistently)
  - _Requirements: 2.3, 2.4, 3.3, 4.3, 7.2_
  - _Leverage: None (pure utility functions)_

- [x] 3. Implement calendar utility functions with tests
  - **Test Specs**: Validate calendar utilities correctly group, transform, and apply color logic
  - **Test Location**: `apps/tere-project/src/features/talent-leave/utils/calendarUtils.test.ts`
  - **Test Cases**:
    - Test groupByTeam() correctly groups leave records by team name
    - Test groupByTeam() sorts teams alphabetically
    - Test groupByTeam() handles empty array gracefully
    - Test transformToRowData() calculates correct leave count
    - Test transformToRowData() formats date range correctly
    - Test transformToRowData() extracts all leave dates as array
    - Test getCellColorClass() returns weekend color when isWeekend=true
    - Test getCellColorClass() returns leave color when isLeaveDate=true
    - Test getCellColorClass() returns holiday color when isHoliday=true
    - Test getCellColorClass() prioritizes weekend > leave > holiday
  - **Acceptance**: All calendar utility tests pass, group/transform logic works correctly
  - **Implementation**: Follow TDD cycle, write tests first, implement functions to pass tests
  - Create `utils/calendarUtils.ts` with all functions from design doc
  - Implement grouping using reduce or Map
  - Use dateUtils functions for date calculations
  - _Requirements: 2.2, 2.4_
  - _Leverage: utils/dateUtils.ts (depends on task 2)_

- [x] 4. Implement Zustand store for calendar state management
  - **Test Specs**: Validate Zustand store state updates correctly and maintains proper state shape
  - **Test Location**: `apps/tere-project/src/features/talent-leave/store/talentLeaveStore.test.ts`
  - **Test Cases**:
    - Test initial state has current month as selectedMonthStart
    - Test setSelectedMonthStart() updates state correctly
    - Test initial modalState is closed with 'create' mode
    - Test openCreateModal() sets modalState to open with 'create' mode
    - Test openEditModal(id) sets modalState to open with 'edit' mode and leaveId
    - Test closeModal() sets modalState to closed
    - Test state updates are immutable (new state objects created)
  - **Acceptance**: All store tests pass, state updates work correctly, no mutation bugs
  - **Implementation**: Follow teamReportFilterStore.ts pattern, use Zustand create function
  - Create `store/talentLeaveStore.ts` following design doc interface
  - Initialize selectedMonthStart to first day of current month
  - Implement all modal state management functions
  - _Requirements: 2.5, 3.1, 4.1_
  - _Leverage: src/features/dashboard/store/teamReportFilterStore.ts for pattern_

- [x] 5. Implement API repository with mocked tests
  - **Test Specs**: Validate repository makes correct API calls with proper parameters and handles responses
  - **Test Location**: `apps/tere-project/src/features/talent-leave/repositories/talentLeaveRepository.test.ts`
  - **Test Cases**:
    - Test fetchLeaveRecords() makes GET request with correct query params
    - Test fetchLeaveRecords() includes date filters in request
    - Test fetchLeaveRecords() includes optional status/team filters
    - Test fetchTalentList() makes GET request to /talent-leave/talents
    - Test createLeave() makes POST request with correct payload
    - Test updateLeave() makes PUT request to /talent-leave/:id with payload
    - Test deleteLeave() makes DELETE request to /talent-leave/:id
    - Test all methods handle axios errors gracefully
  - **Acceptance**: All repository tests pass, API calls use correct endpoints and parameters
  - **Implementation**: Follow jiraRepository.ts pattern, use axiosClient, mock responses in tests
  - Create `repositories/talentLeaveRepository.ts` following design doc
  - Import axiosClient from @src/lib/axiosClient
  - Use URLSearchParams for query string construction
  - Handle errors (let them propagate to hooks)
  - _Requirements: 6.1, 6.2, 3.5, 4.5, 5.2_
  - _Leverage: src/features/dashboard/repositories/jiraRepository.ts, src/lib/axiosClient.ts_

- [x] 6. Implement Google Calendar API client with tests
  - **Test Specs**: Validate Google Calendar client fetches holidays correctly and handles errors gracefully
  - **Test Location**: `apps/tere-project/src/lib/googleCalendar.test.ts`
  - **Test Cases**:
    - Test fetchHolidays() makes GET request to Google Calendar API
    - Test fetchHolidays() includes correct calendar ID (Indonesian holidays)
    - Test fetchHolidays() passes correct date range parameters
    - Test fetchHolidays() transforms response to Holiday[] format
    - Test fetchHolidays() returns empty array on error (graceful degradation)
    - Test fetchHolidays() includes API key from environment variable
  - **Acceptance**: All Google Calendar tests pass, handles success and error cases gracefully
  - **Implementation**: Follow TDD approach, mock axios, test error scenarios
  - Create `lib/googleCalendar.ts` as specified in design doc
  - Use axios (not axiosClient) for external API
  - Return empty array on error (no exceptions)
  - _Requirements: 7.1_
  - _Leverage: None (external API integration)_

- [x] 7. Implement useTalentLeave hook with React Query
  - **Test Specs**: Validate hook fetches leave records correctly using React Query with proper caching
  - **Test Location**: `apps/tere-project/src/features/talent-leave/hooks/useTalentLeave.test.ts`
  - **Test Cases**:
    - Test hook calls repository.fetchLeaveRecords() with correct date range
    - Test hook uses selectedMonthStart from store to calculate dates
    - Test hook is disabled when selectedMonthStart is null
    - Test hook caches data with correct queryKey
    - Test hook refetches when selectedMonthStart changes
    - Test hook handles loading state correctly
    - Test hook handles error state correctly
  - **Acceptance**: All hook tests pass, React Query integration works, caching behaves correctly
  - **Implementation**: Follow useTeamReportFetch.ts pattern, use useQuery from @tanstack/react-query
  - Create `hooks/useTalentLeave.ts` following design doc
  - Calculate startDate and endDate from selectedMonthStart (2 months)
  - Use queryKey: ['talentLeave', selectedMonthStart]
  - Set enabled: !!selectedMonthStart
  - _Requirements: 6.1_
  - _Leverage: src/features/dashboard/hooks/useTeamReportFetch.ts, repositories/talentLeaveRepository.ts, store/talentLeaveStore.ts_

- [x] 8. Implement useTalentList hook with React Query
  - **Test Specs**: Validate hook fetches talent list correctly with appropriate caching
  - **Test Location**: `apps/tere-project/src/features/talent-leave/hooks/useTalentList.test.ts`
  - **Test Cases**:
    - Test hook calls repository.fetchTalentList()
    - Test hook caches data with queryKey: ['talentList']
    - Test hook uses 5-minute staleTime
    - Test hook handles loading state correctly
    - Test hook handles error state correctly
    - Test hook returns TalentResponse[] array
  - **Acceptance**: All hook tests pass, caching works with 5-minute staleTime
  - **Implementation**: Follow React Query pattern, use useQuery with staleTime
  - Create `hooks/useTalentList.ts` following design doc
  - Use queryKey: ['talentList']
  - Set staleTime: 5 * 60 * 1000 (5 minutes)
  - _Requirements: 6.2_
  - _Leverage: src/features/dashboard/hooks/useTeamReportFetch.ts, repositories/talentLeaveRepository.ts_

- [x] 9. Implement useHolidays hook with React Query
  - **Test Specs**: Validate hook fetches holidays correctly with 24-hour caching
  - **Test Location**: `apps/tere-project/src/features/talent-leave/hooks/useHolidays.test.ts`
  - **Test Cases**:
    - Test hook calls googleCalendarClient.fetchHolidays() with date range
    - Test hook caches data with queryKey including dates
    - Test hook uses 24-hour staleTime
    - Test hook retries only once on failure
    - Test hook handles error gracefully (returns empty array)
    - Test hook updates when date range changes
  - **Acceptance**: All hook tests pass, 24-hour caching works, graceful error handling
  - **Implementation**: Use useQuery with long staleTime and limited retry
  - Create `hooks/useHolidays.ts` following design doc
  - Use queryKey: ['holidays', startDate, endDate]
  - Set staleTime: 24 * 60 * 60 * 1000 (24 hours)
  - Set retry: 1 (only retry once)
  - _Requirements: 7.1_
  - _Leverage: lib/googleCalendar.ts_

- [x] 10. Implement useLeaveCreate mutation hook
  - **Test Specs**: Validate hook creates leave records and invalidates cache correctly
  - **Test Location**: `apps/tere-project/src/features/talent-leave/hooks/useLeaveCreate.test.ts`
  - **Test Cases**:
    - Test hook calls repository.createLeave() with correct data
    - Test hook invalidates 'talentLeave' query on success
    - Test hook shows success message on success
    - Test hook shows error message on failure
    - Test hook handles network errors gracefully
    - Test hook returns mutation state (isLoading, isError, isSuccess)
  - **Acceptance**: All mutation tests pass, cache invalidation works, user feedback appears
  - **Implementation**: Use useMutation from React Query, use Ant Design message for notifications
  - Create `hooks/useLeaveCreate.ts` following design doc
  - Use useMutation with mutationFn calling repository
  - In onSuccess: invalidate queries and show success message
  - In onError: show error message
  - _Requirements: 3.5_
  - _Leverage: repositories/talentLeaveRepository.ts_

- [x] 11. Implement useLeaveUpdate mutation hook
  - **Test Specs**: Validate hook updates leave records and invalidates cache correctly
  - **Test Location**: `apps/tere-project/src/features/talent-leave/hooks/useLeaveUpdate.test.ts`
  - **Test Cases**:
    - Test hook calls repository.updateLeave() with id and data
    - Test hook invalidates 'talentLeave' query on success
    - Test hook shows success message on success
    - Test hook shows error message on failure
    - Test hook handles partial updates correctly
    - Test hook returns mutation state correctly
  - **Acceptance**: All mutation tests pass, cache invalidation works, user feedback appears
  - **Implementation**: Use useMutation pattern similar to useLeaveCreate
  - Create `hooks/useLeaveUpdate.ts` following design doc
  - Accept { id, data } as mutationFn parameter
  - Use same onSuccess/onError pattern as create hook
  - _Requirements: 4.5_
  - _Leverage: repositories/talentLeaveRepository.ts_

- [x] 12. Implement useLeaveDelete mutation hook
  - **Test Specs**: Validate hook deletes leave records and invalidates cache correctly
  - **Test Location**: `apps/tere-project/src/features/talent-leave/hooks/useLeaveDelete.test.ts`
  - **Test Cases**:
    - Test hook calls repository.deleteLeave() with id
    - Test hook invalidates 'talentLeave' query on success
    - Test hook shows success message on success
    - Test hook shows error message on failure
    - Test hook handles 404 errors gracefully
    - Test hook returns mutation state correctly
  - **Acceptance**: All mutation tests pass, cache invalidation works, user feedback appears
  - **Implementation**: Use useMutation pattern similar to other mutations
  - Create `hooks/useLeaveDelete.ts` following design doc
  - Accept id as mutationFn parameter
  - Use same onSuccess/onError pattern
  - _Requirements: 5.2_
  - _Leverage: repositories/talentLeaveRepository.ts_

- [x] 13. Implement MonthSelector component with tests
  - **Test Specs**: Validate component renders month picker and updates store correctly
  - **Test Location**: `apps/tere-project/src/features/talent-leave/components/MonthSelector.test.tsx`
  - **Test Cases**:
    - Test component renders Ant Design DatePicker in month mode
    - Test component displays current selected month from store
    - Test onChange calls setSelectedMonthStart() in store
    - Test component updates when store changes
    - Test DatePicker has correct picker="month" prop
    - Test component is keyboard accessible
  - **Acceptance**: All component tests pass, month selection updates store, UI is accessible
  - **Implementation**: Use Ant Design DatePicker, connect to Zustand store
  - Create `components/MonthSelector.tsx` following design doc
  - Import DatePicker from antd
  - Use useTalentLeaveStore() to get/set state
  - Set picker="month" on DatePicker
  - Handle onChange to update store
  - _Requirements: 2.5_
  - _Leverage: Ant Design DatePicker, store/talentLeaveStore.ts_

- [x] 14. Implement LeaveModal component with form and validation
  - **Test Specs**: Validate modal renders form correctly, validates inputs, and handles submissions
  - **Test Location**: `apps/tere-project/src/features/talent-leave/components/LeaveModal.test.tsx`
  - **Test Cases**:
    - Test modal renders when open=true
    - Test modal doesn't render when open=false
    - Test form shows Name dropdown populated from useTalentList()
    - Test Name selection auto-populates Team and Role (read-only fields)
    - Test DateFrom picker disables past dates
    - Test DateTo picker disables dates before DateFrom
    - Test Status dropdown has "Draft" and "Confirmed" options
    - Test form validation prevents submission with missing required fields
    - Test form validation shows error when DateTo < DateFrom
    - Test create mode calls useLeaveCreate().mutate() on submit
    - Test edit mode calls useLeaveUpdate().mutate() on submit
    - Test edit mode shows delete button
    - Test cancel button calls onClose()
    - Test successful submission calls onClose()
  - **Acceptance**: All modal tests pass, form validation works, CRUD operations trigger correctly
  - **Implementation**: Use Ant Design Modal, Form, Select, DatePicker, follow design doc specifications
  - Create `components/LeaveModal.tsx` following design doc
  - Use Ant Design Modal, Form, Select, DatePicker, Button components
  - Fetch talents using useTalentList() hook
  - Use useLeaveCreate, useLeaveUpdate, useLeaveDelete hooks
  - Implement date picker disable functions from dateUtils
  - Show Team and Role as read-only fields (auto-populated)
  - Implement form validation (required fields, date range)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1_
  - _Leverage: Ant Design components, hooks/* (all mutation hooks), utils/dateUtils.ts_

- [x] 15. Implement LeaveCalendar component with team grouping and color coding
  - **Test Specs**: Validate calendar renders correctly, groups by team, applies colors, and handles interactions
  - **Test Location**: `apps/tere-project/src/features/talent-leave/components/LeaveCalendar.test.tsx`
  - **Test Cases**:
    - Test component fetches data using useTalentLeave() and useHolidays()
    - Test component generates 2-month date range from selectedMonthStart
    - Test component groups leave records by team
    - Test component renders team header rows with sky-100 background
    - Test component renders month header rows with purple-100 background
    - Test component renders date columns with MM/DD/YYYY and day names
    - Test component applies weekend color (slate-100) to weekend dates
    - Test component applies holiday color (red-100) to holiday dates (not weekends)
    - Test component applies leave color (red-200) to leave dates
    - Test component prioritizes weekend > leave > holiday for colors
    - Test clicking team member name calls openEditModal() with leave id
    - Test component shows loading indicator when data is loading
    - Test component shows error message when data fetch fails
    - Test component is horizontally scrollable
  - **Acceptance**: All calendar tests pass, data displayed correctly, colors applied per priority, interactions work
  - **Implementation**: Build custom table or use Ant Design Table, implement grouping and coloring logic
  - Create `components/LeaveCalendar.tsx` following design doc
  - Use useTalentLeave(), useHolidays(), useTalentLeaveStore() hooks
  - Use generateDateRange() from dateUtils
  - Use groupByTeam(), transformToRowData(), getCellColorClass() from calendarUtils
  - Render table structure with team headers, month headers, data rows, date columns
  - Apply Tailwind color classes based on cell state
  - Handle name click to open edit modal
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.1_
  - _Leverage: hooks/useTalentLeave.ts, hooks/useHolidays.ts, store/talentLeaveStore.ts, utils/*, Ant Design Table or custom table_

- [x] 16. Implement main TalentLeavePage component
  - **Test Specs**: Validate page renders all components correctly and coordinates their interactions
  - **Test Location**: `apps/tere-project/src/app/dashboard/talent-leave/page.test.tsx`
  - **Test Cases**:
    - Test page renders MonthSelector component
    - Test page renders "Add Leave" button
    - Test page renders LeaveCalendar component
    - Test page renders LeaveModal component
    - Test "Add Leave" button calls openCreateModal() from store
    - Test page shows LoadingBar when data is loading
    - Test page is marked with 'use client' directive
    - Test page layout matches dashboard/reports/page.tsx pattern
    - Test modal state from store controls LeaveModal open/close
  - **Acceptance**: All page tests pass, components render correctly, interactions work, layout matches design
  - **Implementation**: Follow dashboard/reports/page.tsx pattern, assemble all components
  - Create `app/dashboard/talent-leave/page.tsx` following design doc
  - Import MonthSelector, LeaveCalendar, LeaveModal, LoadingBar
  - Use useTalentLeaveStore() for modal state
  - Use useTalentLeave() for loading state
  - Render Add button to trigger openCreateModal()
  - Render all components in proper layout
  - Apply Tailwind classes for spacing and layout
  - _Requirements: 1.1, 2.1, 3.1_
  - _Leverage: components/loadingBar.tsx, components/MonthSelector.tsx, components/LeaveCalendar.tsx, components/LeaveModal.tsx, store/talentLeaveStore.ts_

- [x] 17. Update sidebar navigation with Talent Leave menu item
  - **Test Specs**: Validate sidebar displays new menu item and navigates correctly
  - **Test Location**: `apps/tere-project/src/components/sidebar.test.tsx`
  - **Test Cases**:
    - Test sidebar renders "Talent Leave" menu item
    - Test menu item has Calendar icon from lucide-react
    - Test menu item has key '/dashboard/talent-leave'
    - Test clicking menu item navigates to /dashboard/talent-leave
    - Test menu item is highlighted when pathname matches
    - Test sidebar maintains existing menu items (Team Reporting, Application Monitoring)
  - **Acceptance**: All sidebar tests pass, new menu item appears and works correctly
  - **Implementation**: Add new menu item to menuItems array, import Calendar icon
  - Update `components/sidebar.tsx` following design doc
  - Import Calendar from lucide-react
  - Add new menu item object with key, label, icon
  - Ensure no existing functionality is broken
  - _Requirements: 1.1_
  - _Leverage: components/sidebar.tsx (existing code), lucide-react_

- [x] 18. Add environment variable for Google Calendar API key
  - **Test Specs**: Validate environment variable is loaded correctly and accessible in application
  - **Test Location**: Manual testing / Environment configuration
  - **Test Cases**:
    - Test NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY is defined in .env.local
    - Test environment variable is accessible via process.env
    - Test googleCalendarClient uses the environment variable
    - Test application logs warning if API key is missing (optional)
    - Test API calls to Google Calendar work with valid key
  - **Acceptance**: Environment variable configured, accessible in code, no hardcoded API keys
  - **Implementation**: Add variable to .env.local, document setup process
  - Create or update `apps/tere-project/.env.local`
  - Add NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY=your-api-key
  - Update .env.example if it exists
  - Document in README or setup guide (optional)
  - _Requirements: 7.1, Non-functional (Security)_
  - _Leverage: None (configuration)_

- [x] 19. Run integration tests and fix any cross-component issues
  - **Test Specs**: Validate complete user flows work end-to-end across all components
  - **Test Location**: `apps/tere-project/src/features/talent-leave/integration.test.tsx`
  - **Test Cases**:
    - Test full create flow: navigate � click Add � fill form � submit � verify in calendar
    - Test full edit flow: navigate � click name � modify form � save � verify changes
    - Test full delete flow: navigate � click name � delete � confirm � verify removal
    - Test month selection updates calendar data
    - Test loading states appear during data fetching
    - Test error states show appropriate messages
    - Test cache invalidation refreshes data after mutations
    - Test modal open/close state management works correctly
    - Test talent list populates dropdown correctly
    - Test holiday data integrates with calendar display
  - **Acceptance**: All integration tests pass, user flows work seamlessly, no cross-component bugs
  - **Implementation**: Write integration tests with React Testing Library, mock API responses, test user interactions
  - Create integration test file covering all user flows
  - Mock axiosClient and googleCalendarClient responses
  - Use React Testing Library to simulate user interactions
  - Verify state updates, re-renders, and data flow
  - Fix any bugs discovered during integration testing
  - _Requirements: All (integration of complete feature)_
  - _Leverage: All components, hooks, and utilities_

- [x] 20. Perform accessibility audit and add ARIA labels
  - **Test Specs**: Validate application meets WCAG AA accessibility standards
  - **Test Location**: Manual testing with screen readers + `apps/tere-project/src/features/talent-leave/accessibility.test.tsx`
  - **Test Cases**:
    - Test all interactive elements are keyboard accessible
    - Test modal traps focus correctly (Tab/Shift+Tab cycles within modal)
    - Test Esc key closes modal
    - Test all buttons have proper ARIA labels
    - Test form fields have associated labels
    - Test error messages are announced by screen readers
    - Test table headers have proper scope attributes
    - Test color contrast meets 4.5:1 ratio
    - Test focus indicators are visible
    - Test screen reader can navigate calendar structure
  - **Acceptance**: All accessibility tests pass, meets WCAG AA standards, usable with screen readers
  - **Implementation**: Add ARIA labels, test with keyboard navigation and screen readers
  - Add aria-label to buttons without visible text
  - Add aria-labelledby to form fields
  - Add role="dialog" and aria-modal to modal
  - Add proper table headers with scope attributes
  - Ensure focus trap in modal
  - Test with keyboard navigation
  - Test with screen reader (NVDA, JAWS, or VoiceOver)
  - _Requirements: Non-functional (Accessibility)_
  - _Leverage: All components, Ant Design built-in accessibility_

- [x] 21. Run linting and fix any TypeScript/ESLint errors
  - **Test Specs**: Validate code passes all linting rules and type checking
  - **Test Location**: CI/CD pipeline / command line
  - **Test Cases**:
    - Test `npm run lint` passes without errors
    - Test `npm run type-check` passes without errors (if separate command)
    - Test all files follow project coding conventions
    - Test no unused imports or variables
    - Test consistent code formatting (Prettier)
    - Test all TypeScript types are properly defined (no `any`)
  - **Acceptance**: Linting passes, type checking passes, code follows conventions
  - **Implementation**: Run linting commands, fix errors, ensure consistent formatting
  - Run `npm run lint` from apps/tere-project
  - Fix any ESLint errors or warnings
  - Run TypeScript compiler check
  - Fix any type errors
  - Ensure all imports are used
  - Remove console.log statements (except intentional ones)
  - _Requirements: Non-functional (Maintainability)_
  - _Leverage: ESLint configuration, TypeScript compiler_

- [x] 22. Write unit tests for remaining untested components and utilities
  - **Test Specs**: Achieve comprehensive test coverage for all new code
  - **Test Location**: Various test files alongside source files
  - **Test Cases**:
    - Test DeleteConfirmDialog component (not yet covered)
    - Test edge cases in dateUtils functions
    - Test error scenarios in hooks
    - Test loading states in components
    - Test empty state rendering (no leave records)
    - Test form validation edge cases
    - Test API error handling in repository
    - Test Google Calendar API fallback behavior
  - **Acceptance**: Test coverage >= 80%, all critical paths tested, edge cases handled
  - **Implementation**: Write additional tests for uncovered code paths
  - Create test files for any components not yet tested
  - Add additional test cases for edge cases and error scenarios
  - Mock external dependencies consistently
  - Verify test coverage with coverage report
  - _Requirements: Non-functional (Maintainability, Testing)_
  - _Leverage: Jest, React Testing Library, existing test patterns_

## Implementation Notes

### Test-Driven Development Workflow

For each task, follow this workflow:
1. **RED**: Write failing tests first that describe expected behavior
2. **GREEN**: Write minimal code to make tests pass
3. **REFACTOR**: Clean up code while keeping tests green
4. **VERIFY**: Run all tests to ensure nothing broke

### Dependency Order

Tasks must be completed in order because of dependencies:
- Tasks 1-6: Foundation (no dependencies)
- Tasks 7-12: Hooks (depend on tasks 1-6)
- Tasks 13-15: Components (depend on hooks and utilities)
- Task 16: Page (depends on all components)
- Task 17: Sidebar (independent)
- Tasks 18-22: Integration and polish (depend on all previous tasks)

### Mocking Strategy

- **axiosClient**: Mock using jest.mock('@src/lib/axiosClient')
- **React Query**: Use QueryClient with retry: false in tests
- **Zustand**: Can test store directly or mock in component tests
- **Google Calendar API**: Mock axios responses
- **Next.js Router**: Mock using next/navigation

### Component Testing Best Practices

- Use React Testing Library's user-centric queries (getByRole, getByLabelText)
- Test user interactions, not implementation details
- Mock only external dependencies, not internal functions
- Use data-testid sparingly, prefer semantic queries
- Test loading, success, and error states

### Performance Considerations

- Implement memoization after tests pass (React.memo, useMemo)
- Add virtualization only if needed (>100 rows)
- Profile with React DevTools after implementation
- Optimize only if performance issues are observed

### Error Handling

- All API errors should show user-friendly messages
- Use Ant Design message component for notifications
- Log errors to console for debugging
- Gracefully degrade on external API failures (Google Calendar)

## Success Criteria

Implementation is complete when:
-  All 22 tasks are checked off
-  All tests pass (unit + integration)
-  Linting passes without errors
-  Type checking passes without errors
-  Application runs without console errors
-  All requirements are met and working
-  Code follows project conventions
-  Feature works in development environment
