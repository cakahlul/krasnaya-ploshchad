import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidayApi } from '../api/holiday.api';

export const useHolidays = () => {
  return useQuery({
    queryKey: ['holidays'],
    queryFn: () => holidayApi.fetchHolidays(),
  });
};

export const useCreateHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: holidayApi.createHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });
};

export const useDeleteHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: holidayApi.deleteHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });
};

export const useBulkCreateHolidays = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: holidayApi.bulkCreateHolidays,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });
};
