/**
 * Simple in-memory TTL cache for reducing Firestore reads.
 * Each entry expires after `ttlMs` milliseconds.
 */
export class MemoryCache {
  private store = new Map<string, { data: unknown; expiresAt: number }>();
  private inFlight = new Map<string, Promise<unknown>>();

  constructor(private readonly ttlMs: number) {}

  /**
   * Cache-aside read that also collapses concurrent misses into ONE load. A cold cache used to let
   * every caller in the same tick issue its own query — a productivity-summary range asks for
   * boards and members once per month x group, which meant dozens of identical round trips at once
   * and, against the Supabase transaction pooler, a request that never came back at all.
   */
  async getOrLoad<T>(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;

    const pending = load()
      .then(data => {
        this.set(key, data);
        return data;
      })
      .finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, pending);
    return pending;
  }

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
