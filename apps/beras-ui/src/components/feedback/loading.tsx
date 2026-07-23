import type {
  LoadingIllustrationProps,
  LoadingOverlayProps,
  PageSkeletonProps,
  SkeletonProps,
  SpinnerProps,
} from '../../public/types';

const rootClass = (base: string, className?: string) =>
  `${base}${className ? ` ${className}` : ''}`;

const stageCopy = {
  waiting: 'Waiting for the next step.',
  data: 'Preparing deterministic data.',
  progress: 'Completing the current operation.',
} as const;

export function Spinner({
  className,
  id,
  label = 'Loading',
  size = 'md',
}: SpinnerProps) {
  return (
    <span
      id={id}
      className={rootClass('beras-spinner', className)}
      role="status"
      aria-busy="true"
      data-beras-state="loading"
      data-beras-size={size}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeOpacity="0.25" />
        <path d="M10 3a7 7 0 0 1 7 7" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span>{label}</span>
    </span>
  );
}

export function Skeleton({
  className,
  id,
  label = 'Loading content',
}: SkeletonProps) {
  return (
    <span
      id={id}
      className={rootClass('beras-skeleton', className)}
      role="status"
      aria-busy="true"
      data-beras-state="loading"
    >
      <span className="beras-skeleton-shape" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function PageSkeleton({
  className,
  dense = false,
  id,
  label = 'Loading page',
}: PageSkeletonProps) {
  return (
    <section
      id={id}
      className={rootClass('beras-page-skeleton', className)}
      role="status"
      aria-busy="true"
      data-beras-state="loading"
      data-beras-variant={dense ? 'dense' : 'default'}
    >
      <p>{label}</p>
      <div className="beras-page-skeleton-content" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

function safeProgress(progress: number | undefined): number | undefined {
  if (progress === undefined || !Number.isFinite(progress)) return undefined;
  return Math.min(Math.max(progress, 0), 100);
}

export function LoadingIllustration({
  className,
  id,
  label,
  progress,
  seed = 'beras',
  stage,
}: LoadingIllustrationProps) {
  const value = safeProgress(progress);
  const sceneMark = seed.trim().slice(0, 8).toUpperCase() || 'BERAS';

  return (
    <figure
      id={id}
      className={rootClass('beras-loading-illustration', className)}
      role="status"
      aria-busy="true"
      data-beras-state={stage}
      data-beras-variant="deterministic"
    >
      <svg
        viewBox="0 0 240 140"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M24 112h192" stroke="currentColor" strokeWidth="2" />
        <rect x="42" y="52" width="54" height="60" rx="8" fill="currentColor" opacity="0.12" />
        <rect x="108" y="32" width="88" height="80" rx="8" fill="currentColor" opacity="0.2" />
        <circle cx="69" cy="42" r="12" fill="currentColor" opacity="0.7" />
        <path d="M120 58h64M120 74h48M120 90h56" stroke="currentColor" strokeWidth="5" />
        <text x="120" y="110" fill="currentColor" fontSize="10">
          {sceneMark}
        </text>
      </svg>
      <figcaption>
        <strong>{label}</strong>
        <span>{stageCopy[stage]}</span>
        {value === undefined ? null : (
          <div className="beras-loading-illustration-progress">
            <progress value={value} max="100" aria-label={`${label} progress`}>
              {value}%
            </progress>
            <span>{value}%</span>
          </div>
        )}
      </figcaption>
    </figure>
  );
}

export function LoadingOverlay({
  className,
  id,
  open,
  ...illustration
}: LoadingOverlayProps) {
  return (
    <section
      id={id}
      className={rootClass('beras-loading-overlay', className)}
      hidden={!open}
      aria-busy={open || undefined}
      data-beras-state={open ? 'open' : 'closed'}
    >
      <LoadingIllustration {...illustration} />
    </section>
  );
}
