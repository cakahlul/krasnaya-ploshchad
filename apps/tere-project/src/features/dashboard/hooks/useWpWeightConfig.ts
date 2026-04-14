'use client';

import { useQuery } from '@tanstack/react-query';
import axiosClient from '@src/lib/axiosClient';
import type { AppendixWeightPoint } from '@shared/utils/appendix-level';

export type WpWeights = Record<AppendixWeightPoint, number>;

const DEFAULT_WEIGHTS: WpWeights = {
  'Very Low': 1,
  'Low': 2,
  'Medium': 4,
  'High': 8,
};

async function fetchEffectiveWeights(date: string): Promise<WpWeights> {
  const response = await axiosClient.get(`/wp-weight-config/effective?date=${date}`);
  return response.data;
}

export function useWpWeightConfig(referenceDate?: string) {
  const dateStr = referenceDate?.split('T')[0];

  const { data } = useQuery({
    queryKey: ['wp-weight-config-effective', dateStr],
    queryFn: () => fetchEffectiveWeights(dateStr!),
    enabled: !!dateStr,
    staleTime: 10 * 60 * 1000,
    placeholderData: DEFAULT_WEIGHTS,
  });

  return data ?? DEFAULT_WEIGHTS;
}
