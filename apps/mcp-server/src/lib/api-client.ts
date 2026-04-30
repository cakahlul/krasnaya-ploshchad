import { config } from './config.js';

export async function apiGet<T>(
  path: string,
  params: Record<string, string | undefined>,
): Promise<T> {
  const url = new URL(path, config.apiUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    headers: { 'x-api-key': config.apiKey },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}
