/**
 * Simple in-memory TTL cache for reducing Firestore reads.
 * Each entry expires after `ttlMs` milliseconds.
 */
export class MemoryCache {
  private store = new Map<string, { data: unknown; expiresAt: number }>();

  constructor(private readonly ttlMs: number) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, { data, expiresAt: Date.now() + this.ttlMs });
  }

  invalidate(key?: string): void {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }
}
