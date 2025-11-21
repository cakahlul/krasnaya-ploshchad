# Design Document: Export Talent Leave to Google Spreadsheet

## Overview

This design document outlines the implementation approach for exporting talent leave calendar data to Google Spreadsheets. The feature adds a new export endpoint to the existing `TalentLeaveModule` that generates a formatted Google Spreadsheet matching the UI design of LeaveCalendarSimple, transfers ownership to a specified email address, and leverages Google's automatic email notification system.

The implementation follows NestJS best practices, reuses existing repository methods, and integrates with Google Sheets API v4 and Google Drive API v3 using service account authentication.

## Steering Document Alignment

### Technical Standards (tech.md)
- **Framework**: NestJS with TypeScript - follows existing backend stack
- **Testing**: Jest with unit and integration tests for all new components
- **Database**: Firebase Firestore using existing TalentLeaveRepository
- **API Architecture**: RESTful POST endpoint following existing controller patterns
- **Configuration**: Environment-based service account credentials with @nestjs/config
- **External Integration**: Google Sheets API v4 and Google Drive API v3 via googleapis npm package

### Project Structure (structure.md)
- **Module Organization**: All changes within `apps/aioc-service/src/modules/talent-leave/`
- **NestJS Conventions**: Controller → Service → Repository pattern
- **New Components**: Export service, Google Sheets client, DTOs for export
- **File Naming**: kebab-case (talent-leave-export.service.ts)
- **Testing**: `.spec.ts` files alongside source files
- **Utilities**: Server-side date/calendar utilities matching frontend logic

## Architecture

\`\`\`mermaid
graph TD
    Client[Frontend/API Client] -->|POST /talent-leave/export| Controller[TalentLeaveController]
    Controller -->|Validate DTO| ExportDTO[ExportTalentLeaveDto]
    Controller -->|Call export| ExportService[TalentLeaveExportService]

    ExportService -->|Fetch leave data| Repository[TalentLeaveRepository]
    ExportService -->|Fetch holidays| HolidayAPI[api-harilibur.vercel.app]
    ExportService -->|Transform data| DataTransformer[CalendarDataTransformer]
    ExportService -->|Generate spreadsheet| SheetsClient[GoogleSheetsClient]

    SheetsClient -->|Create spreadsheet| SheetsAPI[Google Sheets API v4]
    SheetsClient -->|Transfer ownership| DriveAPI[Google Drive API v3]

    DriveAPI -->|Send notification| Gmail[Google Email Service]
    Gmail -->|Email with link| User[Owner Email]

    Repository -->|Query| Firestore[(Firestore)]
    HolidayAPI -->|Fetch holidays| APIServer[Free Public Holiday API]

    DataTransformer -->|Calculate| DateUtils[Date Utilities]
    DataTransformer -->|Group by team| TeamUtils[Team Grouping Utils]
    DataTransformer -->|Sprint info| SprintUtils[Sprint Utilities]

    SheetsClient -->|Apply styling| StyleBuilder[SpreadsheetStyleBuilder]

    subgraph "New Components"
        ExportService
        SheetsClient
        DataTransformer
        StyleBuilder
        DateUtils
        TeamUtils
        SprintUtils
    end

    subgraph "Existing Components"
        Controller
        Repository
        Firestore
    end

    subgraph "External Services"
        SheetsAPI
        DriveAPI
        APIServer
        Gmail
    end
\`\`\`

## Components and Interfaces

### 1. Export DTO (interfaces/talent-leave-export.dto.ts)

**Purpose:** Define request/response data structures for export endpoint

**Interfaces:**
\`\`\`typescript
// Request DTO
export interface ExportTalentLeaveDto {
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  ownerEmail: string; // Valid email address
}

// Response DTO
export interface ExportTalentLeaveResponseDto {
  success: boolean;
  message: string;
  spreadsheetTitle: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  ownerEmail: string;
  exportedAt: string;
}
\`\`\`

**Dependencies:** None (interface definitions)

### 2. TalentLeaveExportService (talent-leave-export.service.ts)

**Purpose:** Orchestrate the export process

**Public Methods:**
\`\`\`typescript
async exportToSpreadsheet(dto: ExportTalentLeaveDto): Promise<ExportTalentLeaveResponseDto>
\`\`\`

**Dependencies:**
- TalentLeaveRepository
- GoogleSheetsClient  
- CalendarDataTransformer
- HttpService (Axios)

### 3. GoogleSheetsClient (clients/google-sheets.client.ts)

**Purpose:** Handle all Google Sheets API and Google Drive API operations

**Public Methods:**
\`\`\`typescript
async createSpreadsheet(title, teamGroups, dateColumns, sprintGroups): Promise<string>
async transferOwnership(spreadsheetId, ownerEmail): Promise<void>
\`\`\`

See full design document for complete details.

### 4. CalendarDataTransformer (utils/calendar-data-transformer.ts)

**Purpose:** Transform raw leave data into spreadsheet-ready format

**Public Methods:**
\`\`\`typescript
generateDateColumns(startDate, endDate): CalendarCell[]
groupByTeam(leaveRecords, holidayDates, startDate, endDate): TeamGroupData[]
calculateSprintGroups(dateColumns): Record<string, SprintInfo>
\`\`\`

**Implementation:** Ports frontend logic from calendarUtils.ts, dateUtils.ts, sprintUtils.ts

### 5. Date & Sprint Utilities

**Purpose:** Server-side date/sprint calculations matching frontend

**Functions:**
- generateDateRange()
- calculateDayCount() - excludes weekends and holidays
- getSprintNameWithDateRange()
- isWeekend()

## Data Models

### CalendarCell
\`\`\`typescript
{
  date: string;          // "YYYY-MM-DD"
  dayName: string;       // "Mon", "Tue", etc.
  dayNumber: number;     // 1-31
  isWeekend: boolean;
  isHoliday: boolean;
  isNationalHoliday: boolean;
  holidayName?: string;
}
\`\`\`

### TeamGroupData
\`\`\`typescript
{
  teamName: string;
  memberCount: number;
  members: TeamMemberRow[];
}
\`\`\`

### TeamMemberRow
\`\`\`typescript
{
  id: string;
  name: string;
  team: string;
  leaveCount: number;    // Excluding weekends/holidays
  dateRange: string;     // "13-15 Jan, 20-22 Jan"
  leaveDates: string[];  // ["2025-01-13", "2025-01-14", ...]
  leaveDatesWithStatus: Record<string, 'Draft' | 'Confirmed'>;
}
\`\`\`

### SprintInfo
\`\`\`typescript
{
  name: string;          // "Sprint 25 (13 Jan - 26 Jan)"
  startDate: string;     // "YYYY-MM-DD"
  endDate: string;       // "YYYY-MM-DD"
  dateCount: number;     // Days in sprint within visible range
}
\`\`\`

## Spreadsheet Structure

### Layout
\`\`\`
Row 1 (Header):
┌────┬────────┬───────┬──────────────┬─────┬─────┬─────┐
│ No │  Nama  │Jumlah │ Tanggal Cuti │  1  │  2  │  3  │
│    │        │       │              │ Mon │ Tue │ Wed │
└────┴────────┴───────┴──────────────┴─────┴─────┴─────┘

Row 2 (Team Header):
┌────┬────────────────────────────────┬───────────────────┬─────┐
│    │   Team Lending ● 5             │ Sprint 25 (13-26) │ ... │
└────┴────────────────────────────────┴───────────────────┴─────┘

Row 3+ (Members):
┌────┬────────┬───────┬──────────────┬─────┬─────┬─────┐
│ 1  │ Alice  │   3   │ 13-15 Jan    │  ✓  │  ✓  │  ✓  │
│ 2  │ Bob    │   0   │              │     │     │     │
└────┴────────┴───────┴──────────────┴─────┴─────┴─────┘
\`\`\`

### Column Widths
- No: 60px
- Nama: 150px
- Jumlah: 80px
- Tanggal Cuti: 180px
- Date columns: 70px each

### Row Heights
- Header: 80px
- Team header: 60px
- Member rows: 40px

### Frozen Panes
- Rows: 1 (header row)
- Columns: 4 (No, Nama, Jumlah, Tanggal Cuti)

## Styling Colors

\`\`\`typescript
const COLORS = {
  // Headers
  headerBg: '#EEF2FF',
  headerText: '#374151',
  
  // Dates
  redBg: '#FEE2E2',
  redText: '#B91C1C',
  slateBg: '#F1F5F9',
  whiteBg: '#FFFFFF',
  
  // Team rows
  teamBg: '#DBEAFE',
  teamText: '#312E81',
  
  // Sprint cells
  sprintBg: '#8B5CF6',
  sprintText: '#FFFFFF',
  
  // Leave cells - confirmed
  confirmedBg: '#A7F3D0',
  confirmedBorder: '#059669',
  confirmedCheck: '#059669',
  
  // Leave cells - draft
  draftBg: '#FEF3C7',
  draftBorder: '#D97706',
  draftCheck: '#D97706',
  
  // Member info
  nameText: '#312E81',
  countGreen: '#52C41A',
  countGray: '#D9D9D9',
  grayText: '#4B5563',
};
\`\`\`

## Error Handling

### Error Scenarios

1. **Invalid Date Range**
   - Validation: endDate >= startDate, range <= 90 days
   - HTTP 400 with clear error message

2. **Invalid Email**
   - Validation: valid email format
   - HTTP 400 "ownerEmail must be a valid email address"

3. **Google Sheets API Failure**
   - Catch googleapis errors
   - HTTP 500 "Failed to create spreadsheet"
   - Log with full context

4. **Ownership Transfer Failure**
   - HTTP 500 "Failed to transfer spreadsheet ownership"
   - Cleanup: Delete created spreadsheet
   - Log error details

5. **Firestore Query Failure**
   - HTTP 500 "Failed to retrieve leave data"
   - Log and allow retry

6. **Holidays API Failure**
   - Graceful degradation: proceed without holidays
   - Log warning only

7. **Service Account Not Configured**
   - HTTP 500 "Export service not configured"
   - Check on service initialization

## Testing Strategy

### Unit Tests
- TalentLeaveExportService: date validation, data fetching, error handling
- CalendarDataTransformer: date columns, team grouping, sprint calculations
- DateUtilities: date ranges, leave counting, weekend detection
- SprintUtilities: sprint calculations, name formatting
- GoogleSheetsClient: spreadsheet structure, ownership transfer (mocked)
- SpreadsheetStyleBuilder: color conversion, formatting requests

### Integration Tests
- End-to-end export flow with mocked Google APIs
- Repository integration with Firestore emulator
- Real Google Sheets API with test service account

### E2E Tests
- Happy path: export → email → verify spreadsheet
- Large date range (90 days)
- Multiple teams and sprints
- Error recovery scenarios

## Environment Configuration

\`\`\`bash
# Google Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=export-service@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=project-id

# Google Calendar API
GOOGLE_CALENDAR_INDONESIAN_HOLIDAYS_ID=en.indonesian#holiday@group.v.calendar.google.com
GOOGLE_CALENDAR_API_KEY=your-api-key
\`\`\`

## Security

1. **Credentials**: Store in environment variables, never commit
2. **Email Validation**: Strict regex, prevent injection
3. **Rate Limiting**: 10 exports/hour per user (NestJS Throttler)
4. **Authorization**: Add auth guard matching other talent-leave endpoints
5. **Data Privacy**: Spreadsheets private by default, owner controls sharing

## Performance

1. **API Optimization**: Batch all Google Sheets updates (3 calls total)
2. **Limits**: 90-day max prevents excessive spreadsheet size
3. **Concurrency**: 100 concurrent exports well under API rate limits
4. **Memory**: No caching, single-use export pattern

## Deployment Checklist

- [ ] Install googleapis: `npm install googleapis`
- [ ] Create Google Cloud Project
- [ ] Enable Google Sheets API v4
- [ ] Enable Google Drive API v3
- [ ] Create Service Account
- [ ] Generate JSON credentials
- [ ] Add environment variables
- [ ] Configure rate limiting
- [ ] Add authentication guard
- [ ] Test with real emails
- [ ] Set up monitoring/alerting

## Future Enhancements

1. Export to PDF/Excel formats
2. Customizable column visibility
3. Scheduled recurring exports
4. Export history tracking
