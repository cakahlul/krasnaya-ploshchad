interface Bucket {
  count: number;
  windowStart: number;
}

// Per-identifier token-bucket rate limiter (in-memory).
// Resets on server restart — matches existing NestJS behaviour.
const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(identifier);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    buckets.set(identifier, { count: 1, windowStart: now });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count++;
  return true;
}
