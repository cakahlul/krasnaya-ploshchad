import { NextResponse } from 'next/server';

/**
 * External API response format from libur.deno.dev
 */
interface ExternalHolidayResponse {
  date: string;   // e.g., "2026-01-01"
  name: string;   // e.g., "Tahun Baru 2026 Masehi"
}

/**
 * Response format for our API
 */
interface HolidayResponse {
  date: string;
  name: string;
  isNational: boolean;
}

/**
 * Fetch Indonesian public holidays from libur.deno.dev
 * This is a free public API for Indonesian holidays
 * Source: https://github.com/AbuDhabi/libur-api
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

    // Get unique years in the date range
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const years: number[] = [];

    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }

    // Fetch holidays for each year
    const allHolidays: HolidayResponse[] = [];

    for (const year of years) {
      try {
        const response = await fetch(
          `https://libur.deno.dev/api?year=${year}`,
          {
            headers: {
              Accept: 'application/json',
            },
            // Add timeout using signal
            next: { revalidate: 86400 }, // Cache for 24 hours
          }
        );

        if (!response.ok) {
          console.error(
            `Failed to fetch holidays for year ${year}:`,
            response.status
          );
          continue;
        }

        const data: ExternalHolidayResponse[] = await response.json();

        if (data && Array.isArray(data)) {
          data.forEach((holiday) => {
            // Parse the date string
            const [yearStr, monthStr, dayStr] = holiday.date.split('-');
            const holidayYear = parseInt(yearStr, 10);
            const holidayMonth = parseInt(monthStr, 10) - 1; // Month is 0-indexed
            const holidayDay = parseInt(dayStr, 10);

            // Create date in local timezone
            const holidayDate = new Date(holidayYear, holidayMonth, holidayDay);

            // Only include holidays within our date range
            if (holidayDate >= start && holidayDate <= end) {
              // Normalize date format to YYYY-MM-DD without timezone conversion
              const y = holidayDate.getFullYear();
              const m = String(holidayDate.getMonth() + 1).padStart(2, '0');
              const d = String(holidayDate.getDate()).padStart(2, '0');
              const normalizedDate = `${y}-${m}-${d}`;

              allHolidays.push({
                date: normalizedDate,
                name: holiday.name,
                // Default to true since the API only returns national holidays
                isNational: true,
              });
            }
          });
        }
      } catch (yearError) {
        console.error(`Error fetching holidays for year ${year}:`, yearError);
        // Continue with next year
      }
    }

    console.log(`Fetched ${allHolidays.length} holidays from libur.deno.dev for date range ${startDate} to ${endDate}`);
    return NextResponse.json(allHolidays);
  } catch (error) {
    console.error('Failed to fetch holidays:', error);
    return NextResponse.json([]);
  }
}
