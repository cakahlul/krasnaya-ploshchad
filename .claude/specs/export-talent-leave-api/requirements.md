# Requirements Document: Export Talent Leave to Google Spreadsheet

## Introduction

This feature enables Team Managers to export talent leave calendar data for a selected date range to a Google Spreadsheet with styling that matches the existing talent-leave-ui in tere-project. The API endpoint will generate a formatted spreadsheet matching the simplified calendar view (LeaveCalendarSimple), transfer ownership to the user's email, and Google will automatically send an email notification with the spreadsheet link. This allows managers to easily access exported calendars from their inbox, share leave schedules with stakeholders, create reports, or maintain offline records.

## Alignment with Product Vision

This feature supports the **Krasnaya Ploshchad** product vision by:

- **Automated Reporting**: Extends the automated reporting capability beyond the web interface by enabling export to Google Spreadsheet format
- **Data-Driven Decisions**: Provides managers with exportable data they can share with stakeholders and integrate into other reporting workflows
- **Capacity Planning**: Enables better offline review and distribution of team availability data across different teams and management levels
- **Leave Management**: Complements the centralized leave tracking by providing exportable views for specific time periods

This aligns with the product objective to "Eliminate manual sprint report creation" and "Enable managers to make informed decisions based on metrics" by providing a convenient export mechanism.

## Requirements

### 1. API Endpoint

#### 1.1 Export Endpoint
**User Story:** As a Team Manager, I want to export talent leave data for a selected date range to a Google Spreadsheet that will be sent to my email, so that I can access the spreadsheet directly from my inbox and share it with stakeholders.

**Acceptance Criteria:**
- WHEN a client sends a POST request to `/talent-leave/export` with request body `{ "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "ownerEmail": "user@example.com" }` THEN the system SHALL generate a Google Spreadsheet with talent leave data for that date range and transfer ownership to the specified email
- WHEN the spreadsheet ownership transfer is successful THEN Google SHALL automatically send an email notification to the owner's email with a link to the spreadsheet
- WHEN the spreadsheet generation is successful THEN the system SHALL return HTTP 200 with a JSON response containing success confirmation
- WHEN the startDate parameter is missing THEN the system SHALL return HTTP 400 with error message "startDate is required"
- WHEN the endDate parameter is missing THEN the system SHALL return HTTP 400 with error message "endDate is required"
- WHEN the startDate or endDate parameter has invalid format THEN the system SHALL return HTTP 400 with error message "startDate and endDate must be in YYYY-MM-DD format"
- WHEN endDate is before startDate THEN the system SHALL return HTTP 400 with error message "endDate must be after or equal to startDate"
- WHEN date range span exceeds 90 days THEN the system SHALL return HTTP 400 with error message "date range cannot exceed 90 days"
- WHEN the ownerEmail parameter is missing THEN the system SHALL return HTTP 400 with error message "ownerEmail is required"
- WHEN the ownerEmail parameter has invalid email format THEN the system SHALL return HTTP 400 with error message "ownerEmail must be a valid email address"

#### 1.2 Response Format
**User Story:** As a frontend developer, I want a consistent API response format, so that I can reliably show success confirmation and handle errors.

**Acceptance Criteria:**
- WHEN export succeeds THEN the system SHALL return JSON with structure: `{ "success": true, "message": "Spreadsheet created and sent to {ownerEmail}", "spreadsheetTitle": "Talent Leave - {Start Date} to {End Date}", "dateRange": { "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }, "ownerEmail": "user@example.com", "exportedAt": "ISO8601 timestamp" }`
- WHEN export fails due to Google API error THEN the system SHALL return HTTP 500 with error message "Failed to create spreadsheet"
- WHEN export fails due to ownership transfer error THEN the system SHALL return HTTP 500 with error message "Failed to transfer spreadsheet ownership"
- WHEN export fails due to data retrieval error THEN the system SHALL return HTTP 500 with error message "Failed to retrieve leave data"

### 2. Data Collection

#### 2.1 Leave Data Retrieval
**User Story:** As the system, I want to retrieve all talent leave records for the specified date range, so that the exported spreadsheet contains complete and accurate data.

**Acceptance Criteria:**
- WHEN exporting a date range THEN the system SHALL query Firestore `talent-leave` collection for records with `leaveDate` ranges overlapping the specified date range
- WHEN a leave record has multiple date ranges THEN the system SHALL include all leave dates that fall within the specified date range
- WHEN a leave record has no leave dates in the specified date range THEN the system SHALL exclude that record from the export
- WHEN retrieving data THEN the system SHALL reuse the existing `TalentLeaveRepository.findAll()` method with startDate and endDate filters

#### 2.2 Holiday Data Retrieval
**User Story:** As the system, I want to include Indonesian public holidays in the exported spreadsheet, so that managers can see which dates are official holidays.

**Acceptance Criteria:**
- WHEN exporting a date range THEN the system SHALL fetch Indonesian public holidays from Google Calendar API for that date range
- WHEN holiday data is unavailable THEN the system SHALL proceed with export showing only leave data (holidays are optional)
- WHEN retrieving holidays THEN the system SHALL distinguish between national holidays and regional holidays based on the API response
- WHEN fetching holidays THEN the system SHALL use the same API as the frontend: api-harilibur.vercel.app (free public API for Indonesian holidays)

#### 2.3 Team Grouping
**User Story:** As a Team Manager, I want the exported spreadsheet to group team members by team, so that I can easily review each team's leave schedule.

**Acceptance Criteria:**
- WHEN exporting THEN the system SHALL group leave records by team name
- WHEN grouping THEN the system SHALL sort teams alphabetically
- WHEN grouping THEN the system SHALL sort team members within each team by name alphabetically

### 3. Spreadsheet Generation

#### 3.1 Spreadsheet Structure
**User Story:** As a Team Manager, I want the exported spreadsheet to have the same structure as the web UI calendar (LeaveCalendarSimple), so that it's familiar and easy to understand.

**Acceptance Criteria:**
- WHEN creating spreadsheet THEN the system SHALL create a sheet titled "Talent Leave - {DD/MM/YYYY} to {DD/MM/YYYY}"
- WHEN creating spreadsheet THEN the system SHALL include the following static columns: No, Nama (Name), Jumlah (Count), Tanggal Cuti (Leave Dates)
- WHEN creating spreadsheet THEN the system SHALL include one column per day in the date range
- WHEN creating spreadsheet THEN the system SHALL create a single header row showing: static column headers and date columns (date number + day name)
- WHEN creating spreadsheet THEN the system SHALL freeze the first 1 row (header) and first 4 columns (static info)

#### 3.2 Spreadsheet Styling - Headers
**User Story:** As a Team Manager, I want the spreadsheet headers to be styled clearly, so that I can easily distinguish different sections of the calendar.

**Acceptance Criteria:**
- WHEN styling static column headers (No, Nama, Jumlah, Tanggal Cuti) THEN the system SHALL apply: bold font, dark gray text (#374151), light blue gradient background (#EEF2FF to #DBEAFE), center alignment (except Nama and Tanggal Cuti which are left-aligned)
- WHEN styling date column headers THEN the system SHALL display date number (bold, 14pt) and day name (10pt, uppercase) in single cell with line break
- WHEN a date header is a national holiday THEN the system SHALL apply red gradient background (#FEE2E2 to #FCA5A5) and red text (#B91C1C)
- WHEN a date header is a weekend THEN the system SHALL apply slate gray gradient background (#F1F5F9 to #E2E8F0)
- WHEN a date header is a regular day THEN the system SHALL apply light gray gradient background (#F9FAFB to #F3F4F6)
- WHEN a date is a holiday (national or regional) THEN the system SHALL display holiday name below day name in smaller font (9pt) and add as cell comment/note

#### 3.3 Spreadsheet Styling - Static Columns
**User Story:** As a Team Manager, I want the name and info columns to be styled clearly, so that I can easily read team member information.

**Acceptance Criteria:**
- WHEN styling "No" column cells THEN the system SHALL apply: center alignment, medium font weight, gray text (#4B5563), white background
- WHEN styling "Nama" column cells THEN the system SHALL apply: left alignment, indigo text (#312E81), medium font weight, white background
- WHEN styling "Jumlah" column cells THEN the system SHALL apply: center alignment, bold font, green background (#52C41A) with white text if count > 0, gray background (#D9D9D9) with dark text if count = 0, rounded corners styling
- WHEN styling "Tanggal Cuti" column cells THEN the system SHALL apply: small font (9pt), gray text (#4B5563), wrap text enabled, white background, left alignment

#### 3.4 Spreadsheet Styling - Team Rows
**User Story:** As a Team Manager, I want team header rows to be visually distinct with sprint information, so that I can easily identify team groupings and sprint boundaries.

**Acceptance Criteria:**
- WHEN creating a team header row THEN the system SHALL leave "No" column empty
- WHEN creating a team header row THEN the system SHALL merge static columns from "Nama" to "Tanggal Cuti" (spanning 3 columns)
- WHEN styling team header static cells THEN the system SHALL apply: bold font, large size (12pt), indigo text (#312E81), light blue gradient background (#DBEAFE to #BFDBFE), display team name with member count (e.g., "Team Lending ● 5")
- WHEN creating team header date cells THEN the system SHALL display sprint names spanning multiple date columns
- WHEN styling sprint cells in team row THEN the system SHALL apply: bold font, white text, purple-indigo gradient background (#8B5CF6 to #6366F1), center alignment, merged cells spanning sprint duration (e.g., "Sprint 25 (13 Jan - 26 Jan)")
- WHEN multiple sprints exist in date range THEN the system SHALL create separate merged cells for each sprint

#### 3.5 Spreadsheet Styling - Leave Date Cells
**User Story:** As a Team Manager, I want leave dates to be visually highlighted with colors matching the web UI, so that I can quickly identify leave patterns.

**Acceptance Criteria:**
- WHEN a date is a national holiday THEN the system SHALL apply red background (#FEE2E2) regardless of leave status
- WHEN a date is a weekend (Saturday/Sunday) THEN the system SHALL apply slate gray background (#F1F5F9) regardless of leave status
- WHEN a date is a confirmed leave date (not weekend/national holiday) THEN the system SHALL apply green gradient background (#A7F3D0 to #6EE7B7) and a checkmark symbol ()
- WHEN a date is a draft leave date (not weekend/national holiday) THEN the system SHALL apply amber gradient background (#FEF3C7 to #FDE68A) and a checkmark symbol ()
- WHEN a date has no leave THEN the system SHALL apply white background
- WHEN styling all date cells THEN the system SHALL apply center alignment and borders

#### 3.6 Column Widths and Row Heights
**User Story:** As a Team Manager, I want appropriate column widths and row heights, so that all information is readable without excessive scrolling.

**Acceptance Criteria:**
- WHEN setting column widths THEN the system SHALL set: No (60px), Nama (150px), Jumlah (80px), Tanggal Cuti (180px)
- WHEN setting date column widths THEN the system SHALL set each date column to 70px
- WHEN creating spreadsheet THEN the system SHALL enable text wrapping for "Tanggal Cuti" column
- WHEN setting row heights THEN the system SHALL set: header row (80px), team header rows (60px), member rows (40px)

### 4. Google Sheets Integration

#### 4.1 Service Account Setup
**User Story:** As a developer, I want to use Google Sheets API with service account authentication, so that the system can create spreadsheets without user OAuth flow.

**Acceptance Criteria:**
- WHEN the aioc-service starts THEN the system SHALL initialize Google Sheets API client using service account credentials from environment variables
- WHEN service account credentials are missing THEN the system SHALL log error and disable export functionality
- WHEN export endpoint is called without credentials configured THEN the system SHALL return HTTP 500 with error message "Export service not configured"

#### 4.2 Spreadsheet Creation
**User Story:** As the system, I want to create a new Google Spreadsheet for each export request, so that each export is independent and shareable.

**Acceptance Criteria:**
- WHEN creating spreadsheet THEN the system SHALL use Google Sheets API v4 `spreadsheets.create` endpoint
- WHEN creating spreadsheet THEN the system SHALL set title to "Talent Leave - {Month Name} {Year}"
- WHEN creation succeeds THEN the system SHALL store the spreadsheet ID for subsequent operations
- WHEN creation fails THEN the system SHALL throw InternalServerErrorException with message "Failed to create spreadsheet"

#### 4.3 Spreadsheet Ownership Transfer
**User Story:** As a Team Manager, I want the exported spreadsheet to be transferred to my email ownership, so that I receive an email notification with the spreadsheet link and have full control over it.

**Acceptance Criteria:**
- WHEN spreadsheet is created THEN the system SHALL use Google Drive API v3 `permissions.create` endpoint to transfer ownership
- WHEN transferring ownership THEN the system SHALL set permission with: `role: "owner"`, `type: "user"`, `emailAddress: "{ownerEmail}"`, `transferOwnership: true`
- WHEN ownership is transferred THEN Google SHALL automatically send an email to the owner with subject line containing the spreadsheet title and a direct link to open the spreadsheet
- WHEN ownership transfer succeeds THEN the service account SHALL automatically lose owner access (new owner becomes sole owner)
- WHEN ownership transfer fails (e.g., invalid email, Google Workspace restrictions) THEN the system SHALL throw InternalServerErrorException with message "Failed to transfer spreadsheet ownership to {ownerEmail}"
- WHEN transferring ownership THEN the system SHALL NOT set additional public sharing permissions (only the owner can decide sharing settings after receiving ownership)

#### 4.4 Data Population
**User Story:** As the system, I want to populate the spreadsheet efficiently using batch operations, so that export completes in reasonable time.

**Acceptance Criteria:**
- WHEN populating data THEN the system SHALL use `spreadsheets.batchUpdate` API for formatting and styling
- WHEN populating data THEN the system SHALL use `spreadsheets.values.batchUpdate` API for cell values
- WHEN populating data THEN the system SHALL minimize API calls by batching all updates into single requests
- WHEN batch operations fail THEN the system SHALL throw InternalServerErrorException with message "Failed to populate spreadsheet data"

### 5. Reusable Components

#### 5.1 Existing Repository Usage
**User Story:** As a developer, I want to reuse existing data access logic, so that data retrieval is consistent across features.

**Acceptance Criteria:**
- WHEN retrieving leave data THEN the system SHALL use `TalentLeaveRepository.findAll(filters)` method
- WHEN filtering by date range THEN the system SHALL pass `startDate` and `endDate` parameters matching the month boundaries
- WHEN retrieving teams THEN the system SHALL use `TalentLeaveRepository.findAllTeams()` method if needed for validation

#### 5.2 Date Utilities
**User Story:** As a developer, I want to reuse date calculation logic from frontend utilities, so that date handling is consistent.

**Acceptance Criteria:**
- WHEN calculating leave count THEN the system SHALL implement server-side equivalent of `calculateDayCount()` from dateUtils.ts (excluding weekends and holidays)
- WHEN generating date range THEN the system SHALL implement server-side equivalent of `generateDateRange()` from dateUtils.ts
- WHEN determining sprint dates THEN the system SHALL implement server-side equivalent of sprint calculation logic from sprintUtils.ts

## Non-Functional Requirements

### Performance
- Export operation SHALL complete within 30 seconds for typical month data (up to 50 team members)
- Export operation SHALL handle up to 100 concurrent requests without degradation
- Google Sheets API calls SHALL use batch operations to minimize latency
- Firestore queries SHALL use existing indexes for optimal performance

### Security
- Service account credentials SHALL be stored in environment variables (never committed to repository)
- Service account SHALL have minimum required permissions (Google Sheets API and Google Drive API read/write)
- API endpoint SHALL validate month parameter to prevent injection attacks
- API endpoint SHALL validate ownerEmail parameter to ensure valid email format
- API endpoint SHALL prevent email injection attacks by sanitizing email input
- Generated spreadsheets SHALL be owned by the requesting user (no public access by default)
- API endpoint SHALL include authentication/authorization checks consistent with other talent-leave endpoints (if applicable)
- API endpoint SHALL prevent abuse by rate limiting export requests (e.g., max 10 exports per hour per user)

### Reliability
- Export SHALL handle Google API rate limits gracefully with appropriate error messages
- Export SHALL validate all input parameters before calling external APIs
- Export SHALL log errors with sufficient context for debugging
- Export SHALL clean up partial spreadsheets if creation fails midway (delete incomplete spreadsheet)

### Usability
- Exported spreadsheet SHALL visually match the talent-leave-ui calendar styling
- Exported spreadsheet SHALL include clear headers and labels in Indonesian language
- Exported spreadsheet SHALL include metadata (export date, month) in a header or footer section
- Error messages SHALL be clear and actionable for frontend developers and end users
- User SHALL receive email notification from Google with direct link to the spreadsheet within 1 minute of successful export
- Email notification from Google SHALL include spreadsheet title and preview
- API response message SHALL clearly indicate that spreadsheet has been sent to the user's email
