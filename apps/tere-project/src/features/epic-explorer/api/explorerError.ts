import axios from 'axios';
import type { ExplorerErrorBody } from '../types/epic-explorer.types';

/**
 * Extract the HTTP status from a React Query error (SLS-16813). Branch on this
 * status — NEVER on an empty response body. Returns null for non-HTTP errors
 * (network/timeout), which the UI treats as a generic Jira/network error.
 */
export function errorStatus(error: unknown): number | null {
  if (axios.isAxiosError(error)) return error.response?.status ?? null;
  return null;
}

/** Server-supplied `{ message }` from an error body, if present. */
export function errorMessage(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ExplorerErrorBody | undefined;
    if (body && typeof body.message === 'string') return body.message;
  }
  return null;
}
