import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./ProductivitySummary.tsx', import.meta.url), 'utf8');

test('exposes stable range, Group, calculate, and progress QA surfaces', () => {
  for (const selector of [
    'productivity-summary-range',
    'productivity-summary-group-filter',
    'productivity-summary-calculate',
    'productivity-summary-progress',
  ]) {
    assert.match(source, new RegExp(`data-qa=\\"${selector}\\"`));
  }
});

test('uses the canonical query and does not expose a Team selector', () => {
  for (const field of ['startMonth', 'endMonth', 'selectedGroups', "'WP'"]) {
    assert.match(source, new RegExp(field));
  }
  assert.doesNotMatch(source, /MultiSelectTeam|selectedTeams|teamsParam/);
});
