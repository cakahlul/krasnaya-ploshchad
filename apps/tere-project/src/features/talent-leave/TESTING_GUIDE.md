# Testing Guide - Talent Leave Feature

## Overview

This document outlines additional test cases needed to achieve comprehensive test coverage (>=80%) for the Talent Leave feature. All test files have been created as placeholders and are ready for implementation once the testing infrastructure (Jest + React Testing Library) is set up.

## Testing Infrastructure Setup Required

Before implementing these tests, set up:
1. Jest configuration for Next.js 15
2. React Testing Library
3. Testing utilities for React Query
4. Testing utilities for Zustand
5. Mock service worker (MSW) for API mocking

## Test Coverage Status

### ✅ Test Files Created (Placeholders)
- [x] dateUtils.test.ts - Basic tests exist, need edge cases
- [x] calendarUtils.test.ts - Basic tests exist, need edge cases
- [x] talentLeaveStore.test.ts - Placeholder only
- [x] talentLeaveRepository.test.ts - Placeholder with mock patterns
- [x] All hook test files (placeholders)
- [x] All component test files (placeholders)
- [x] integration.test.tsx - Comprehensive placeholder
- [x] accessibility.test.tsx - WCAG test cases documented

### 🔄 Additional Tests Needed

## 1. Edge Cases - dateUtils.ts

**File:** `utils/dateUtils.test.ts`

### Additional Test Cases:

```typescript
describe('generateDateRange - Edge Cases', () => {
  it('should handle leap year February correctly', () => {
    // Test with February 2024 (leap year)
    const startDate = new Date(2024, 1, 1); // Feb 1, 2024
    const result = generateDateRange(startDate);
    // Should have 29 days for Feb + 31 for Mar = 60 days
    expect(result).toHaveLength(60);
  });

  it('should handle non-leap year February correctly', () => {
    // Test with February 2023 (non-leap year)
    const startDate = new Date(2023, 1, 1);
    const result = generateDateRange(startDate);
    // Should have 28 days for Feb + 31 for Mar = 59 days
    expect(result).toHaveLength(59);
  });

  it('should handle year boundary correctly', () => {
    // December to January transition
    const startDate = new Date(2024, 11, 1); // Dec 1, 2024
    const result = generateDateRange(startDate);
    // Should cross into 2025
    expect(result[result.length - 1].date).toContain('2025-01');
  });

  it('should correctly identify all weekend days', () => {
    const startDate = new Date(2024, 0, 1); // Jan 1, 2024
    const result = generateDateRange(startDate);
    const weekends = result.filter(cell => cell.isWeekend);
    // Count Saturdays and Sundays in Jan+Feb 2024
    expect(weekends.length).toBeGreaterThan(15); // At least 8 weeks
  });
});

describe('isDateInLeaveRange - Edge Cases', () => {
  it('should return true for exact start date', () => {
    const result = isDateInLeaveRange('2024-01-15', '2024-01-15', '2024-01-20');
    expect(result).toBe(true);
  });

  it('should return true for exact end date', () => {
    const result = isDateInLeaveRange('2024-01-20', '2024-01-15', '2024-01-20');
    expect(result).toBe(true);
  });

  it('should handle single day leave', () => {
    const result = isDateInLeaveRange('2024-01-15', '2024-01-15', '2024-01-15');
    expect(result).toBe(true);
  });

  it('should handle dates with time components', () => {
    const result = isDateInLeaveRange(
      '2024-01-16T10:30:00Z',
      '2024-01-15T00:00:00Z',
      '2024-01-20T23:59:59Z'
    );
    expect(result).toBe(true);
  });
});

describe('calculateDayCount - Edge Cases', () => {
  it('should return 1 for same day', () => {
    const result = calculateDayCount('2024-01-15', '2024-01-15');
    expect(result).toBe(1);
  });

  it('should handle month boundaries', () => {
    const result = calculateDayCount('2024-01-30', '2024-02-02');
    expect(result).toBe(4); // Jan 30, 31, Feb 1, 2
  });

  it('should handle year boundaries', () => {
    const result = calculateDayCount('2024-12-30', '2025-01-02');
    expect(result).toBe(4); // Dec 30, 31, Jan 1, 2
  });
});

describe('disablePastDates - Edge Cases', () => {
  it('should not disable today', () => {
    const today = dayjs();
    const result = disablePastDates(today);
    expect(result).toBe(false);
  });

  it('should disable yesterday', () => {
    const yesterday = dayjs().subtract(1, 'day');
    const result = disablePastDates(yesterday);
    expect(result).toBe(true);
  });
});

describe('disableBeforeDate - Edge Cases', () => {
  it('should not disable when minDate is null', () => {
    const someDate = dayjs('2024-01-15');
    const result = disableBeforeDate(someDate, null);
    expect(result).toBe(false);
  });

  it('should not disable the exact minDate', () => {
    const minDate = dayjs('2024-01-15');
    const result = disableBeforeDate(minDate, minDate);
    expect(result).toBe(false);
  });
});
```

## 2. Error Scenarios - Hooks

### useHolidays.test.ts

```typescript
describe('useHolidays - Error Scenarios', () => {
  it('should handle API failure gracefully', () => {
    // Mock googleCalendarClient to throw error
    // Verify hook returns empty array
    // Verify no error is thrown to component
  });

  it('should retry failed requests', () => {
    // Mock API to fail once then succeed
    // Verify retry behavior
  });

  it('should not retry indefinitely', () => {
    // Mock API to always fail
    // Verify retry limit is respected (retry: 1)
  });
});
```

### useTalentLeave.test.ts

```typescript
describe('useTalentLeave - Error Scenarios', () => {
  it('should handle network errors', () => {
    // Mock network failure
    // Verify isError is true
    // Verify error message is accessible
  });

  it('should handle 500 server errors', () => {
    // Mock 500 response
    // Verify error state
  });

  it('should not fetch when selectedMonthStart is null', () => {
    // Mock store with null selectedMonthStart
    // Verify API not called (enabled: false)
  });
});
```

### useLeaveCreate/Update/Delete.test.ts

```typescript
describe('Mutation Hooks - Error Scenarios', () => {
  it('should show error message on 400 validation error', () => {
    // Mock 400 response
    // Verify error message shown
  });

  it('should show error message on 401 unauthorized', () => {
    // Mock 401 response
    // Verify error message
  });

  it('should show error message on 404 not found (update/delete)', () => {
    // Mock 404 response
    // Verify error message
  });

  it('should not invalidate cache on error', () => {
    // Mock mutation failure
    // Verify cache not invalidated
  });
});
```

## 3. Loading States - Components

### LeaveCalendar.test.tsx

```typescript
describe('LeaveCalendar - Loading States', () => {
  it('should show loading spinner when data is loading', () => {
    // Mock useTalentLeave with isLoading: true
    // Verify Spin component is rendered
  });

  it('should show loading spinner when holidays are loading', () => {
    // Mock useHolidays with isLoading: true
    // Verify Spin component is rendered
  });

  it('should hide loading spinner when both data sources are loaded', () => {
    // Mock both hooks with isLoading: false
    // Verify Spin component is not rendered
  });
});
```

### LeaveModal.test.tsx

```typescript
describe('LeaveModal - Loading States', () => {
  it('should disable submit button while creating', () => {
    // Mock useLeaveCreate with isPending: true
    // Verify submit button is disabled/loading
  });

  it('should disable submit button while updating', () => {
    // Mock useLeaveUpdate with isPending: true
    // Verify submit button is disabled/loading
  });

  it('should disable delete button while deleting', () => {
    // Mock useLeaveDelete with isPending: true
    // Verify delete button is disabled/loading
  });
});
```

## 4. Empty States

### LeaveCalendar.test.tsx

```typescript
describe('LeaveCalendar - Empty States', () => {
  it('should render empty table when no leave records', () => {
    // Mock useTalentLeave with empty array
    // Verify table structure exists
    // Verify no team groups rendered
  });

  it('should still show holidays when no leave records', () => {
    // Mock useTalentLeave with empty array
    // Mock useHolidays with holiday data
    // Verify holiday colors applied
  });
});
```

## 5. Form Validation Edge Cases

### LeaveModal.test.tsx

```typescript
describe('LeaveModal - Validation Edge Cases', () => {
  it('should prevent submission with empty Name', () => {
    // Leave Name field empty
    // Try to submit
    // Verify validation error shown
  });

  it('should prevent submission with empty dates', () => {
    // Leave date fields empty
    // Try to submit
    // Verify validation errors
  });

  it('should prevent submission with end date before start date', () => {
    // Set end date before start date
    // Try to submit
    // Verify validation error
  });

  it('should allow same day for start and end date', () => {
    // Set same date for both
    // Submit form
    // Verify no validation error
  });

  it('should clear validation errors when field is corrected', () => {
    // Trigger validation error
    // Correct the field
    // Verify error is cleared
  });
});
```

## 6. API Error Handling - Repository

### talentLeaveRepository.test.ts

```typescript
describe('talentLeaveRepository - Error Handling', () => {
  it('should throw error on network failure', async () => {
    // Mock axios to reject
    await expect(
      talentLeaveRepository.fetchLeaveRecords('2024-01-01', '2024-02-29')
    ).rejects.toThrow();
  });

  it('should include proper error information', async () => {
    // Mock 400 response with validation errors
    // Verify error contains response data
  });

  it('should handle timeout errors', async () => {
    // Mock timeout
    // Verify timeout error is thrown
  });

  it('should include auth token in requests', async () => {
    // Mock axiosClient
    // Make request
    // Verify Authorization header included
  });
});
```

## 7. Google Calendar API Fallback

### googleCalendar.test.ts

```typescript
describe('googleCalendarClient - Fallback Behavior', () => {
  it('should return empty array on network error', async () => {
    // Mock axios to reject
    const result = await googleCalendarClient.fetchHolidays('2024-01-01', '2024-12-31');
    expect(result).toEqual([]);
  });

  it('should return empty array on invalid response', async () => {
    // Mock response with invalid data structure
    const result = await googleCalendarClient.fetchHolidays('2024-01-01', '2024-12-31');
    expect(result).toEqual([]);
  });

  it('should log error to console', async () => {
    // Mock console.error
    // Mock API failure
    // Verify console.error was called
  });
});
```

## 8. Store State Management

### talentLeaveStore.test.ts

```typescript
describe('talentLeaveStore - State Management', () => {
  it('should initialize with current month', () => {
    const { selectedMonthStart } = useTalentLeaveStore.getState();
    const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    expect(selectedMonthStart).toEqual(currentMonth);
  });

  it('should update selectedMonthStart', () => {
    const newDate = new Date(2024, 5, 1); // June 1, 2024
    useTalentLeaveStore.getState().setSelectedMonthStart(newDate);
    expect(useTalentLeaveStore.getState().selectedMonthStart).toEqual(newDate);
  });

  it('should open create modal', () => {
    useTalentLeaveStore.getState().openCreateModal();
    const { modalState } = useTalentLeaveStore.getState();
    expect(modalState.open).toBe(true);
    expect(modalState.mode).toBe('create');
  });

  it('should open edit modal with leaveId', () => {
    useTalentLeaveStore.getState().openEditModal('leave-123');
    const { modalState } = useTalentLeaveStore.getState();
    expect(modalState.open).toBe(true);
    expect(modalState.mode).toBe('edit');
    expect(modalState.leaveId).toBe('leave-123');
  });

  it('should close modal and reset mode', () => {
    // Open edit modal first
    useTalentLeaveStore.getState().openEditModal('leave-123');
    // Close it
    useTalentLeaveStore.getState().closeModal();
    const { modalState } = useTalentLeaveStore.getState();
    expect(modalState.open).toBe(false);
    expect(modalState.mode).toBe('create');
    expect(modalState.leaveId).toBeUndefined();
  });
});
```

## 9. Calendar Utilities Edge Cases

### calendarUtils.test.ts

```typescript
describe('groupByTeam - Edge Cases', () => {
  it('should handle empty array', () => {
    const result = groupByTeam([]);
    expect(result).toEqual([]);
  });

  it('should handle single team', () => {
    // Test with all records from same team
    // Verify single group returned
  });

  it('should sort teams alphabetically', () => {
    // Test with teams: Zulu, Alpha, Beta
    // Verify order: Alpha, Beta, Zulu
  });

  it('should handle special characters in team names', () => {
    // Test with team names containing &, -, etc.
    // Verify correct grouping
  });
});

describe('transformToRowData - Edge Cases', () => {
  it('should handle same-day leave', () => {
    // dateFrom === dateTo
    // Verify leaveCount is 1
    // Verify leaveDates has single entry
  });

  it('should handle very long leave periods', () => {
    // Test 30+ day leave
    // Verify all dates included
  });
});

describe('getCellColorClass - All Combinations', () => {
  it('should handle all 8 combinations of boolean flags', () => {
    // Test all combinations:
    // weekend=T, holiday=T, leave=T -> weekend (slate-100)
    // weekend=T, holiday=T, leave=F -> weekend (slate-100)
    // weekend=T, holiday=F, leave=T -> weekend (slate-100)
    // weekend=T, holiday=F, leave=F -> weekend (slate-100)
    // weekend=F, holiday=T, leave=T -> leave (red-200)
    // weekend=F, holiday=T, leave=F -> holiday (red-100)
    // weekend=F, holiday=F, leave=T -> leave (red-200)
    // weekend=F, holiday=F, leave=F -> white
  });
});
```

## Test Coverage Goals

### Target Coverage
- **Overall**: >= 80%
- **Utilities**: >= 90% (pure functions, easy to test)
- **Hooks**: >= 75% (require React Query/Zustand mocks)
- **Components**: >= 70% (require RTL setup)
- **Integration**: Key user flows covered

### Critical Paths to Test
1. ✅ Create leave record flow
2. ✅ Edit leave record flow
3. ✅ Delete leave record flow
4. ✅ Month selection updates calendar
5. ✅ Error handling doesn't crash app
6. ✅ Loading states show correctly
7. ✅ Form validation prevents invalid data
8. ✅ Cache invalidation works

## Running Tests (When Infrastructure is Ready)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test dateUtils.test.ts
```

## Mocking Patterns

### React Query
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);
```

### Zustand
```typescript
import { act } from '@testing-library/react';

beforeEach(() => {
  // Reset store before each test
  act(() => {
    useTalentLeaveStore.setState({
      selectedMonthStart: new Date(2024, 0, 1),
      modalState: { open: false, mode: 'create' },
    });
  });
});
```

### Axios
```typescript
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

mockedAxios.get.mockResolvedValue({ data: [...] });
```

## Next Steps

1. Set up Jest configuration for Next.js 15
2. Install React Testing Library dependencies
3. Configure coverage thresholds
4. Implement tests starting with utilities (easiest)
5. Move to hooks (moderate complexity)
6. Finish with components (most complex)
7. Add integration tests last
