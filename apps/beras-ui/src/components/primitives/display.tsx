'use client';

import type { MouseEvent } from 'react';

import type {
  AvatarProps,
  BadgeProps,
  BrandMarkProps,
  CardProps,
  CodeBlockProps,
  DividerProps,
  MetricCardProps,
  ProgressMeterProps,
  SecretFieldProps,
  StatGridProps,
  StatusBadgeProps,
  TagProps,
} from '../../public/types';
import { interactionSource } from './action-logic';
import { Button } from './actions';
import { CloseIcon } from './icons';

const rootClass = (base: string, className?: string) =>
  `${base}${className ? ` ${className}` : ''}`;

export function BrandMark({
  className,
  compact = false,
  id,
  label = 'Beras',
}: BrandMarkProps) {
  return (
    <span
      id={id}
      className={rootClass('beras-brand-mark', className)}
      role="img"
      aria-label={label}
      data-beras-variant={compact ? 'compact' : 'default'}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M14 3c5 3 8 7 8 12a8 8 0 0 1-16 0c0-5 3-9 8-12Z" />
        <path d="M9 15h10M10 11h8M11 19h6" />
      </svg>
      {compact ? null : <span aria-hidden="true">{label}</span>}
    </span>
  );
}

export function Badge({ children, className, id, tone = 'neutral' }: BadgeProps) {
  return (
    <span
      id={id}
      className={rootClass('beras-badge', className)}
      data-beras-tone={tone}
      data-beras-variant="soft"
    >
      {children}
    </span>
  );
}

export function StatusBadge({
  children,
  className,
  id,
  tone = 'neutral',
}: StatusBadgeProps) {
  return (
    <span
      id={id}
      className={rootClass('beras-status-badge', className)}
      data-beras-tone={tone}
      data-beras-variant="soft"
    >
      {children}
    </span>
  );
}

export function Tag({
  children,
  className,
  id,
  onAction,
  removable = false,
  tone = 'neutral',
}: TagProps) {
  function remove(event: MouseEvent<HTMLButtonElement>) {
    onAction?.('remove', { source: interactionSource(event) });
  }

  return (
    <span
      id={id}
      className={rootClass('beras-tag', className)}
      data-beras-tone={tone}
      data-beras-variant="soft"
    >
      <span>{children}</span>
      {removable ? (
        <button type="button" aria-label="Remove tag" onClick={remove}>
          <CloseIcon size={14} />
        </button>
      ) : null}
    </span>
  );
}

export function Avatar({
  className,
  id,
  imageUrl,
  initials,
  name,
  size = 'md',
}: AvatarProps) {
  const fallback =
    initials ??
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();

  return (
    <span
      id={id}
      className={rootClass('beras-avatar', className)}
      role="img"
      aria-label={name}
      data-beras-size={size}
    >
      {imageUrl ? (
        // Framework-neutral package contract requires native HTML, not next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" />
      ) : (
        <span aria-hidden="true">{fallback}</span>
      )}
    </span>
  );
}

export function Card({ children, className, id, title }: CardProps) {
  return (
    <article id={id} className={rootClass('beras-card', className)}>
      {title ? <strong>{title}</strong> : null}
      <div>{children}</div>
    </article>
  );
}

export function MetricCard({
  className,
  description,
  id,
  label,
  tone = 'neutral',
  value,
}: MetricCardProps) {
  return (
    <article
      id={id}
      className={rootClass('beras-metric-card', className)}
      aria-label={label}
      data-beras-tone={tone}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      {description ? <p>{description}</p> : null}
    </article>
  );
}

export function StatGrid({ className, id, items }: StatGridProps) {
  return (
    <dl id={id} className={rootClass('beras-stat-grid', className)}>
      {items.map((item) => (
        <div key={item.id} data-beras-tone={item.tone ?? 'neutral'}>
          <dt>{item.label}</dt>
          <dd>
            <strong>{item.value}</strong>
            {item.description ? <span>{item.description}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ProgressMeter({
  className,
  description,
  id,
  label,
  max = 100,
  tone = 'brand',
  value,
}: ProgressMeterProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), safeMax);

  return (
    <label
      id={id}
      className={rootClass('beras-progress-meter', className)}
      data-beras-tone={tone}
    >
      <span>{label}</span>
      <progress value={safeValue} max={safeMax} />
      <span>
        {safeValue} of {safeMax}
      </span>
      {description ? <span>{description}</span> : null}
    </label>
  );
}

export function Divider({ className, id, label }: DividerProps) {
  return (
    <div
      id={id}
      className={rootClass('beras-divider', className)}
      role="separator"
      aria-label={label}
      aria-orientation="horizontal"
    >
      {label ? <span>{label}</span> : null}
    </div>
  );
}

export function CodeBlock({ className, code, id, language }: CodeBlockProps) {
  return (
    <pre
      id={id}
      className={rootClass('beras-code-block', className)}
      aria-label={language ? `${language} code` : 'Code'}
    >
      <code data-beras-language={language}>{code}</code>
    </pre>
  );
}

export function SecretField({
  actions = [],
  className,
  id,
  label,
  onAction,
  revealed = false,
  value,
}: SecretFieldProps) {
  return (
    <section
      id={id}
      className={rootClass('beras-secret-field', className)}
      aria-label={label}
      data-beras-state={revealed ? 'revealed' : 'concealed'}
    >
      <label>
        <span>{label}</span>
        <input type={revealed ? 'text' : 'password'} value={value} readOnly />
      </label>
      {actions.length > 0 ? (
        <div role="group" aria-label={`${label} actions`}>
          {actions.map((action) => (
            <Button
              key={action.id}
              actionId={action.id}
              disabled={action.disabled}
              pending={action.pending}
              onAction={onAction}
              size="sm"
              variant="outline"
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
