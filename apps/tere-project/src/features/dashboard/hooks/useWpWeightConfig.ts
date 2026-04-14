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

async function fetchEffectiveWeights(): Promise<WpWeights> {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const response = await axiosClient.get(`/wp-weight-config/effective?date=${dateStr}`);
  return response.data;
}

export function useWpWeightConfig() {
  const { data } = useQuery({
    queryKey: ['wp-weight-config-effective'],
    queryFn: fetchEffectiveWeights,
    staleTime: 10 * 60 * 1000,
    placeholderData: DEFAULT_WEIGHTS,
  });

  return data ?? DEFAULT_WEIGHTS;
}
