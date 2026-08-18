export function getSearchContentState(isLoading: boolean, resultCount: number) {
  if (isLoading && resultCount === 0) return 'loading' as const;
  if (resultCount === 0) return 'empty' as const;
  return 'results' as const;
}
