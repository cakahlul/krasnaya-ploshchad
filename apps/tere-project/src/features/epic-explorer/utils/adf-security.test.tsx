import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdfDescription } from './adfToReact';

test('descriptions render attacker HTML as text and reject executable links', () => {
  const attack = '<img src=x onerror=alert(1)>';
  const text = renderToStaticMarkup(<AdfDescription value={attack} />);
  assert.doesNotMatch(text, /<img/);
  assert.match(text, /&lt;img/);
  const adf = renderToStaticMarkup(<AdfDescription value={{ type: 'doc', content: [
    { type: 'emoji', attrs: { text: attack } },
    { type: 'paragraph', content: [{ type: 'text', text: attack, marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] },
    { type: 'inlineCard', attrs: { url: 'javascript:alert(1)' } },
  ] }} />);
  assert.doesNotMatch(adf, /<img|href="javascript:/);
});
