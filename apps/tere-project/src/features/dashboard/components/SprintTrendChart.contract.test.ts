import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./SprintTrendChart.tsx', import.meta.url), 'utf8');

test('exposes each sprint point provenance through accessible detail text', () => {
  assert.match(source, /<details style=\{\{ color: T\.subCol/);
  assert.match(source, /<summary>Show sprint data source details<\/summary>/);
  assert.match(source, /data\?\.points\.map\(point =>/);
  assert.match(source, /<li key=\{point\.sprintId\}>/);
  assert.match(source, /point\.sourceMetadata \? reportProvenanceText\(point\.sourceMetadata\)/);
});

test('keeps legacy trend points explicit when point metadata is absent', () => {
  assert.match(source, /: 'Source not provided'/);
  assert.doesNotMatch(source, /point\.sourceMetadata \? reportProvenanceText\(data\.sourceMetadata/);
});
