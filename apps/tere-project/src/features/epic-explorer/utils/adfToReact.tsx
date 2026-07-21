'use client';

import React from 'react';

/**
 * Minimal ADF (Atlassian Document Format) → React renderer for Jira descriptions.
 *
 * Jira Cloud REST v3 returns descriptions as an ADF JSON tree, not HTML/markdown.
 * We walk that tree into React elements directly — NEVER dangerouslySetInnerHTML,
 * so there is no HTML-injection surface (marks/links are mapped to safe elements,
 * link hrefs are scheme-checked). Covers the block/inline node set Jira actually
 * emits for hand-typed descriptions: paragraph, headings, bullet/ordered lists,
 * blockquote, codeBlock, rule, hardBreak, and text marks (strong/em/code/strike/
 * underline/link). Unknown node types fall back to rendering their children, so
 * nothing is silently dropped.
 *
 * A plain string (older v2 payloads) renders as pre-wrapped text.
 */

type AdfNode = {
  type?: string;
  text?: string;
  content?: AdfNode[];
  marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
};

/** Only http(s) and mailto links render as anchors; anything else → plain text. */
function safeHref(href: unknown): string | null {
  if (typeof href !== 'string') return null;
  return /^(https?:|mailto:)/i.test(href.trim()) ? href : null;
}

function renderText(node: AdfNode, key: React.Key): React.ReactNode {
  let el: React.ReactNode = node.text ?? '';
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case 'strong': el = <strong>{el}</strong>; break;
      case 'em': el = <em>{el}</em>; break;
      case 'code': el = <code>{el}</code>; break;
      case 'strike': el = <s>{el}</s>; break;
      case 'underline': el = <u>{el}</u>; break;
      case 'link': {
        const href = safeHref(mark.attrs?.href);
        if (href) el = <a href={href} target="_blank" rel="noopener noreferrer">{el}</a>;
        break;
      }
    }
  }
  return <React.Fragment key={key}>{el}</React.Fragment>;
}

function renderChildren(nodes: AdfNode[] | undefined): React.ReactNode {
  return (nodes ?? []).map((child, i) => renderNode(child, i));
}

function renderNode(node: AdfNode, key: React.Key): React.ReactNode {
  switch (node.type) {
    case 'text':
      return renderText(node, key);
    case 'hardBreak':
      return <br key={key} />;
    case 'paragraph':
      return <p key={key} style={{ margin: '0 0 8px' }}>{renderChildren(node.content)}</p>;
    case 'heading': {
      const level = Math.min(Math.max(Number(node.attrs?.level ?? 3), 1), 6);
      // Bigger for higher-level headings; level sets both size and semantic tag.
      const style: React.CSSProperties = { margin: '12px 0 6px', fontWeight: 700, fontSize: [17, 16, 15, 14, 13, 13][level - 1] };
      const kids = renderChildren(node.content);
      return React.createElement(`h${level}`, { key, style }, kids);
    }
    case 'bulletList':
      return <ul key={key} style={{ margin: '0 0 8px', paddingLeft: 20 }}>{renderChildren(node.content)}</ul>;
    case 'orderedList':
      return <ol key={key} style={{ margin: '0 0 8px', paddingLeft: 20 }}>{renderChildren(node.content)}</ol>;
    case 'listItem':
      return <li key={key}>{renderChildren(node.content)}</li>;
    case 'blockquote':
      return (
        <blockquote key={key} style={{ margin: '0 0 8px', paddingLeft: 12, borderLeft: '3px solid currentColor', opacity: 0.8 }}>
          {renderChildren(node.content)}
        </blockquote>
      );
    case 'codeBlock':
      return (
        <pre key={key} style={{ margin: '0 0 8px', padding: 10, borderRadius: 8, overflowX: 'auto', background: 'rgba(127,127,127,0.12)', fontSize: 12 }}>
          <code>{renderChildren(node.content)}</code>
        </pre>
      );
    case 'rule':
      return <hr key={key} style={{ border: 'none', borderTop: '1px solid rgba(127,127,127,0.3)', margin: '10px 0' }} />;
    default:
      // Unknown node: render its children so content is never dropped.
      return node.content ? <React.Fragment key={key}>{renderChildren(node.content)}</React.Fragment> : null;
  }
}

/**
 * Renders a Jira description (ADF object or plain string) as React nodes, or
 * null when empty. Callers decide the em-dash fallback for null.
 */
export function AdfDescription({ value }: { value: unknown }): React.ReactElement | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    const t = value.trim();
    return t ? <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{t}</p> : null;
  }
  if (typeof value !== 'object') return null;
  const doc = value as AdfNode;
  const rendered = renderChildren(doc.content);
  return <div style={{ fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }}>{rendered}</div>;
}

/** true when a description has any renderable content (used for the em-dash fallback). */
export function hasDescription(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value !== 'object') return false;
  const doc = value as AdfNode;
  return Array.isArray(doc.content) && doc.content.length > 0;
}
