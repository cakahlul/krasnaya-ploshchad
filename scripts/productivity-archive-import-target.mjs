export function assertSupabaseTarget(databaseUrl, expectedProjectRef) {
  if (!/^[a-z0-9]+$/.test(expectedProjectRef)) throw new Error('invalid expected project ref');
  const url = new URL(databaseUrl);
  if (!url.hostname.endsWith('.supabase.com') && !url.hostname.endsWith('.supabase.co')) {
    throw new Error('DATABASE_URL must use a Supabase host');
  }
  const actualProjectRef = url.username.startsWith('postgres.')
    ? url.username.slice('postgres.'.length)
    : url.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/)?.[1];
  if (actualProjectRef !== expectedProjectRef) throw new Error('Supabase project ref mismatch');
  return url;
}
