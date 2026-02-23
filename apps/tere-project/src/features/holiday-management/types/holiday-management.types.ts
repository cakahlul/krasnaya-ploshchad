export interface Holiday {
  id: string;
  holiday_date: string;
  holiday_name: string;
  is_national_holiday: boolean;
}

export interface CreateHolidayRequest {
  date: string;
  name: string;
}
