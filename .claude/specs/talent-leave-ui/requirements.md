# Requirements Document: Talent Leave UI

## Introduction

The Talent Leave UI feature automates the manual process of tracking team member leave dates through a visual calendar interface. This feature integrates with the existing talent-leave API in aioc-service to provide create, read, update, and delete (CRUD) operations for leave management. The UI presents leave data in a spreadsheet-like calendar view, showing leave dates across teams with color-coded indicators for weekends, public holidays (fetched from Google Calendar API), and individual leave dates.

## Alignment with Product Vision

This feature supports the Krasnaya Ploshchad product vision by:
- **Automated Reporting**: Eliminates manual leave tracking through spreadsheets
- **Performance Visibility**: Provides clear visibility of team availability for better sprint planning
- **Data-Driven Decisions**: Enables managers to make informed decisions about team capacity
- **Sprint Optimization**: Helps teams plan sprints more effectively by visualizing leave patterns
- **Capacity Planning**: Enables better sprint planning by visualizing team availability

## Codebase Analysis Summary

### Existing Components to Reuse
- **Sidebar navigation** ([sidebar.tsx](apps/tere-project/src/components/sidebar.tsx)): Add new menu item for Talent Leave
- **Dashboard layout** ([layout.tsx](apps/tere-project/src/app/dashboard/layout.tsx)): Use existing authenticated layout pattern
- **Axios client** ([axiosClient.ts](apps/tere-project/src/lib/axiosClient.ts)): Reuse for API calls with Firebase auth
- **TanStack React Query**: Follow existing pattern from [useTeamReportFetch.ts](apps/tere-project/src/features/dashboard/hooks/useTeamReportFetch.ts)
- **Zustand store pattern**: Follow existing filter store pattern from [teamReportFilterStore.ts](apps/tere-project/src/features/dashboard/store/teamReportFilterStore.ts)
- **Ant Design components**: Use DatePicker, Select, Modal, Button components (already in use)
- **Tailwind color scheme**: Use existing colors (primary, secondary, accent) from [tailwind.config.ts](apps/tere-project/tailwind.config.ts)

### Existing API
- **Talent Leave API**: Backend module exists at [apps/aioc-service/src/modules/talent-leave/](apps/aioc-service/src/modules/talent-leave/)
  - GET /talent-leave (with filters: startDate, endDate, status, team)
  - GET /talent-leave/talents (returns talent list with resolved team and role names)
  - GET /talent-leave/teams (returns list of team names)
  - GET /talent-leave/:id
  - POST /talent-leave
  - PUT /talent-leave/:id
  - DELETE /talent-leave/:id

## Requirements

### 1. Navigation and Access

#### 1.1 Menu Item Addition
**User Story:** As a team manager, I want to access the Talent Leave feature from the sidebar navigation, so that I can manage team leave schedules.

WHEN the user is logged in and viewing the dashboard THEN the system SHALL display a "Talent Leave" menu item in the sidebar navigation.

WHEN the user clicks the "Talent Leave" menu item THEN the system SHALL navigate to /dashboard/talent-leave route.

### 2. List View - Calendar Display

#### 2.1 Default Calendar View
**User Story:** As a team manager, I want to see a calendar view of all team members' leave dates, so that I can quickly identify team availability.

WHEN the user navigates to the talent leave page THEN the system SHALL display a calendar view showing 2 months from the current month start date.

WHEN the calendar is displayed THEN the system SHALL show columns for: No (Number), Nama (Name), Jml (Amount of leave days), Tanggal Cuti (Date Leave range), Status, Role, and individual date columns for each day.

#### 2.2 Team Grouping
**User Story:** As a team manager, I want to see team members grouped by their teams, so that I can view leave patterns per team.

WHEN displaying the leave list THEN the system SHALL group all team members by their team name.

WHEN a team group is displayed THEN the system SHALL show a team header row with the team name using a modern soft blue color (#E0F2FE or similar).

#### 2.3 Date Range Display
**User Story:** As a team manager, I want to see date columns with day names, so that I can quickly identify specific dates.

WHEN displaying the calendar THEN the system SHALL show each date column with format: MM/DD/YYYY and Indonesian day name (Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu).

WHEN displaying the calendar THEN the system SHALL organize dates by month with a month header row showing the month name (Sprint name placeholder) using a modern soft purple/lavender color (#F3E8FF or similar).

#### 2.4 Color Coding
**User Story:** As a team manager, I want to see different colors for weekends, holidays, and leave dates, so that I can quickly distinguish between them.

WHEN displaying date columns THEN the system SHALL color weekend dates (Saturday, Sunday) with a modern soft gray (#F1F5F9 or similar).

WHEN displaying date columns THEN the system SHALL color public holiday dates (excluding weekends) with a modern soft coral/red (#FEE2E2 or similar).

WHEN a team member has leave on a specific date THEN the system SHALL color that date cell with a modern soft red/pink (#FECACA or similar).

IF a date is both a weekend AND a public holiday THEN the system SHALL use only the weekend color (gray).

#### 2.5 Month Selection
**User Story:** As a team manager, I want to adjust the calendar month range, so that I can view leave schedules for different time periods.

WHEN viewing the calendar THEN the system SHALL provide a month selector control to adjust the starting month.

WHEN the user selects a different starting month THEN the system SHALL update the calendar to show 2 months starting from the selected month.

### 3. Create Leave Record

#### 3.1 Add Leave Button
**User Story:** As a team manager, I want to add new leave records, so that I can track team member absences.

WHEN viewing the leave list THEN the system SHALL display an "Add" or "Add Leave" button prominently.

WHEN the user clicks the Add button THEN the system SHALL open a modal dialog with a form to create a new leave record.

#### 3.2 Leave Creation Form - Name Field
**User Story:** As a team manager, I want to select team members from a dropdown, so that I can avoid typos and ensure data consistency.

WHEN the create leave modal is displayed THEN the system SHALL show a dropdown field for "Name" populated with talent names from GET /talent-leave/talents API.

WHEN the user selects a name from the dropdown THEN the system SHALL automatically populate the Team and Role fields based on the selected talent's data from the API.

#### 3.3 Leave Creation Form - Date Fields
**User Story:** As a team manager, I want to use date pickers for date selection, so that I can easily pick dates without typing.

WHEN the create leave modal is displayed THEN the system SHALL show a "Date From" field with a date picker component.

WHEN displaying the "Date From" date picker THEN the system SHALL disable all past dates (backdate prevention).

WHEN the create leave modal is displayed THEN the system SHALL show a "Date To" field with a date picker component.

WHEN the user selects a "Date From" value THEN the "Date To" date picker SHALL disable all dates before the selected "Date From" date.

WHEN the user fills the form THEN the system SHALL validate that "Date To" is the same as or greater than "Date From".

IF "Date To" is before "Date From" THEN the system SHALL display a validation error message.

#### 3.4 Leave Creation Form - Status Field
**User Story:** As a team manager, I want to set the leave status, so that I can distinguish between planned and confirmed leaves.

WHEN the create leave modal is displayed THEN the system SHALL show a "Status" dropdown field with two options: "Draft" and "Confirmed".

WHEN the user submits the form THEN the system SHALL validate that a status is selected.

#### 3.5 Leave Creation Form - Submission
**User Story:** As a team manager, I want to submit the leave form, so that I can save the leave record.

WHEN the user fills the form THEN the system SHALL validate that all required fields (Name, Date From, Date To, Status) are provided.

WHEN the user submits the form THEN the system SHALL send a POST request to /talent-leave endpoint with fields: name (from selected talent), team (from selected talent), role (from selected talent), dateFrom, dateTo, status.

IF the create request succeeds THEN the system SHALL close the modal, refresh the calendar view, and display a success message.

IF the create request fails THEN the system SHALL display an error message and keep the modal open.

### 4. View and Edit Leave Record

#### 4.1 Open Leave Details
**User Story:** As a team manager, I want to click on a team member's name to view their leave details, so that I can review or modify leave information.

WHEN the user clicks on a team member's name in the leave list THEN the system SHALL open a modal dialog showing the leave record details.

WHEN the details modal is displayed THEN the system SHALL show the same fields as the create form (Name dropdown, Date From, Date To, Status dropdown) populated with current values.

#### 4.2 Edit Leave Record - Name Field
**User Story:** As a team manager, I want to change the team member if needed, so that I can correct assignment errors.

WHEN viewing leave details in the modal THEN the system SHALL display the Name field as a dropdown populated from GET /talent-leave/talents API with the current value selected.

WHEN the user selects a different name THEN the system SHALL automatically update the Team and Role fields based on the selected talent's data.

#### 4.3 Edit Leave Record - Date Fields
**User Story:** As a team manager, I want to modify leave dates, so that I can correct date errors or adjust leave schedules.

WHEN viewing leave details in the modal THEN the system SHALL show "Date From" and "Date To" fields with date pickers.

WHEN displaying the "Date From" date picker THEN the system SHALL disable all past dates (backdate prevention).

WHEN the user modifies "Date From" THEN the "Date To" date picker SHALL disable all dates before the new "Date From" date.

#### 4.4 Edit Leave Record - Status Field
**User Story:** As a team manager, I want to change the leave status, so that I can update leave confirmation status.

WHEN viewing leave details in the modal THEN the system SHALL display the Status field as a dropdown with options "Draft" and "Confirmed".

#### 4.5 Edit Leave Record - Submission
**User Story:** As a team manager, I want to save my changes, so that I can update leave information.

WHEN the user clicks "Save" button THEN the system SHALL validate the modified data.

IF validation passes THEN the system SHALL send a PUT request to /talent-leave/:id endpoint with updated fields.

IF the update request succeeds THEN the system SHALL close the modal, refresh the calendar view, and display a success message.

IF the update request fails THEN the system SHALL display an error message and keep the modal open.

#### 4.6 Cancel Edit
**User Story:** As a team manager, I want to cancel editing, so that I can discard changes if I made a mistake.

WHEN viewing the edit modal THEN the system SHALL display a "Cancel" button.

WHEN the user clicks "Cancel" THEN the system SHALL close the modal without saving changes.

### 5. Delete Leave Record

#### 5.1 Delete Button Display
**User Story:** As a team manager, I want to delete leave records, so that I can remove cancelled or erroneous entries.

WHEN viewing leave details in the modal THEN the system SHALL display a small trash icon button for deletion.

WHEN displaying the delete button THEN the system SHALL use a subtle, non-prominent styling to avoid attracting accidental clicks.

#### 5.2 Delete Confirmation
**User Story:** As a team manager, I want to confirm before deleting, so that I don't accidentally remove leave records.

WHEN the user clicks the delete (trash icon) button THEN the system SHALL display a confirmation dialog asking "Are you sure you want to delete this leave record?"

IF the user confirms deletion THEN the system SHALL send a DELETE request to /talent-leave/:id endpoint.

IF the delete request succeeds THEN the system SHALL close the modal, refresh the calendar view, and display a success message.

IF the delete request fails THEN the system SHALL display an error message.

### 6. Data Integration

#### 6.1 Fetch Leave Data
**User Story:** As a team manager, I want to see current leave data when I open the page, so that I have up-to-date information.

WHEN the user navigates to the talent leave page THEN the system SHALL fetch leave records using GET /talent-leave with date range filters (startDate, endDate).

WHEN fetching leave data THEN the system SHALL use TanStack React Query for caching and state management.

WHEN the API request is pending THEN the system SHALL display a loading indicator.

IF the API request fails THEN the system SHALL display an error message with retry option.

#### 6.2 Fetch Talent List
**User Story:** As a team manager, I want the name dropdown to show all team members, so that I can select any team member when creating or editing leave records.

WHEN the create or edit modal is opened THEN the system SHALL fetch the talent list using GET /talent-leave/talents.

WHEN the talent list is fetched THEN the system SHALL populate the Name dropdown with talent names.

WHEN displaying talent names in the dropdown THEN the system SHALL show the name field from the API response.

WHEN a talent is selected THEN the system SHALL use the team and role fields from the selected talent record for the leave record.

### 7. Public Holiday Management

#### 7.1 Holiday Data Source
**User Story:** As a team manager, I want public holidays to be marked automatically from Google Calendar API, so that I can distinguish between leave days and holidays.

WHEN the calendar is displayed THEN the system SHALL fetch Indonesian public holidays for the displayed date range using Google Calendar API.

WHEN fetching holidays from Google Calendar API THEN the system SHALL use the Indonesia holiday calendar (en.indonesian#holiday@group.v.calendar.google.com).

WHEN the holiday API request is pending THEN the system SHALL render the calendar without holiday colors.

IF the holiday API request succeeds THEN the system SHALL mark holiday dates with the appropriate color (#FEE2E2).

IF the holiday API request fails THEN the system SHALL log the error and render the calendar without holiday markings.

#### 7.2 Weekend Detection
**User Story:** As a team manager, I want weekends to be marked automatically, so that I can distinguish between working days and weekends.

WHEN the calendar is displayed THEN the system SHALL identify weekend dates (Saturday and Sunday) for the displayed date range.

WHEN a date is a weekend THEN the system SHALL color that date column with soft gray (#F1F5F9).

### 8. Calendar Layout

#### 8.1 Responsive Display
**User Story:** As a team manager, I want the calendar to be usable on different screen sizes, so that I can access it from various devices.

WHEN viewing the calendar on desktop THEN the system SHALL display all date columns horizontally scrollable if needed.

WHEN viewing the calendar on mobile/tablet THEN the system SHALL maintain usability through appropriate responsive design.

#### 8.2 Column Width Management
**User Story:** As a team manager, I want to see all information clearly, so that I can read leave details without confusion.

WHEN displaying the calendar THEN the system SHALL use fixed minimum widths for name and role columns to ensure readability.

WHEN displaying date columns THEN the system SHALL use consistent width for all date cells.

## Non-Functional Requirements

### Performance
- Calendar rendering should complete within 2 seconds for up to 100 team members
- API requests should use proper caching to minimize redundant calls
- Date calculations and filtering should not cause UI lag
- Google Calendar API requests should be cached for the displayed month range to minimize API calls

### Security
- All API requests must include Firebase authentication tokens (existing pattern)
- Users must be authenticated to access the talent leave feature
- Follow existing authorization patterns from aioc-service
- Google Calendar API key should be stored securely in environment variables

### Reliability
- Handle API errors gracefully with user-friendly error messages
- Validate all date inputs to prevent invalid data submission
- Provide loading states during asynchronous operations
- Gracefully handle Google Calendar API failures by rendering calendar without holiday data

### Usability
- Use modern, soft, eye-catching colors that align with existing tere-project design
- Ensure color contrast meets accessibility standards (WCAG AA minimum)
- Provide clear visual feedback for all user actions (loading, success, error)
- Make the delete button subtle but discoverable
- Use consistent spacing and typography with existing dashboard pages
- Date pickers should be intuitive and easy to use
- Dropdown selections should be searchable for large talent lists

### Maintainability
- Follow existing project structure conventions (features/talent-leave/)
- Use TypeScript for all components
- Implement proper error boundaries
- Write unit tests for business logic and components
- Use existing patterns for state management (Zustand + React Query)
- Create reusable hooks for Google Calendar API integration

### Data Integrity
- Ensure date range validation (dateTo >= dateFrom)
- Prevent backdating by disabling past dates in date pickers
- Prevent duplicate leave entries for the same person and overlapping dates
- Handle timezone considerations for date comparisons
- Ensure team and role data consistency by using API responses rather than manual input
