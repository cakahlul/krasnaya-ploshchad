'use client';

import { useQuery } from '@tanstack/react-query';
import axiosClient from '@src/lib/axiosClient';

export type TargetWpRates = Record<string, number>;

const DEFAULT_RATES: TargetWpRates = {
  junior: 4.5,
  medior: 6,
  senior: 8,
  'individual contributor': 8,
};

async function fetchEffectiveRates(date: string): Promise<TargetWpRates> {
  const response = await axiosClient.get(`/target-wp-config/effective?date=${date}`);
  return response.data;
}

export function useTargetWpConfig(referenceDate?: string) {
  const dateStr = referenceDate?.split('T')[0];

  const { data } = useQuery({
    queryKey: ['target-wp-config-effective', dateStr],
    queryFn: () => fetchEffectiveRates(dateStr!),
    enabled: !!dateStr,
    staleTime: 10 * 60 * 1000,
    placeholderData: DEFAULT_RATES,
  });

  return data ?? DEFAULT_RATES;
}
