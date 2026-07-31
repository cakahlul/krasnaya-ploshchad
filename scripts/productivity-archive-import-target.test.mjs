import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSupabaseTarget } from './productivity-archive-import-target.mjs';

test('accepts only the explicitly confirmed Supabase project', () => {
  assert.doesNotThrow(() => assertSupabaseTarget(
    'postgresql://postgres.example:secret@aws-1.pooler.supabase.com:6543/postgres',
    'example',
  ));
  assert.throws(() => assertSupabaseTarget(
    'postgresql://postgres.other:secret@aws-1.pooler.supabase.com:6543/postgres',
    'example',
  ), /project ref mismatch/);
  assert.throws(() => assertSupabaseTarget(
    'postgresql://user:secret@localhost:5432/postgres',
    'example',
  ), /Supabase host/);
});
