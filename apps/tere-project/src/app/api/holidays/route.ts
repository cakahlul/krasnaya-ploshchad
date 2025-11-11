import { NextResponse } from 'next/server';

/**
 * Fetch Indonesian public holidays from api-hari-libur
 * This is a free public API for Indonesian holidays
 * Source: https://github.com/radyakaze/api-hari-libur
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'startDate and endDate are required' },
      { status: 400 }
    );
  }

  try {
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Collect all unique month-year combinations in the range
    const monthYearPairs: Array<{ month: number; year: number }> = [];
    const current = new Date(start);

    while (current <= end) {
      const month = current.getMonth() + 1; // 1-12
      const year = current.getFullYear();

      // Add if not already in list
      if (!monthYearPairs.some(p => p.month === month && p.year === year)) {
        monthYearPairs.push({ month, year });
      }

      // Move to next month
      current.setMonth(current.getMonth() + 1);
    }

    // Fetch holidays for each month
    const allHolidays: Array<{
      date: string;
      name: string;
      isNational: boolean;
    }> = [];

    for (const { month, year } of monthYearPairs) {
      const response = await fetch(
        `https://api-harilibur.vercel.app/api?month=${month}&year=${year}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(
          `Failed to fetch holidays for ${month}/${year}:`,
          response.status
        );
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await response.json();

      if (data && Array.isArray(data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((holiday: any) => {
          // Parse the date string (handles both 2026-01-1 and 2026-01-01)
          const [yearStr, monthStr, dayStr] = holiday.holiday_date.split('-');
          const holidayYear = parseInt(yearStr, 10);
          const holidayMonth = parseInt(monthStr, 10) - 1; // Month is 0-indexed
          const holidayDay = parseInt(dayStr, 10);

          // Create date in local timezone
          const holidayDate = new Date(holidayYear, holidayMonth, holidayDay);

          // Only include holidays within our date range
          if (holidayDate >= start && holidayDate <= end) {
            // Normalize date format to YYYY-MM-DD without timezone conversion
            const year = holidayDate.getFullYear();
            const month = String(holidayDate.getMonth() + 1).padStart(2, '0');
            const day = String(holidayDate.getDate()).padStart(2, '0');
            const normalizedDate = `${year}-${month}-${day}`;

            allHolidays.push({
              date: normalizedDate, // Always YYYY-MM-DD format
              name: holiday.holiday_name,
              isNational: holiday.is_national_holiday,
            });
          }
        });
      }
    }

    console.log(`Fetched ${allHolidays.length} holidays from api-hari-libur for date range ${startDate} to ${endDate}`);
    return NextResponse.json(allHolidays);
  } catch (error) {
    console.error('Failed to fetch holidays:', error);
    return NextResponse.json([]);
  }
}
