import type { ReactNode } from 'react';

import type { BerasIconProps } from '../../public/types';

interface IconSvgProps extends BerasIconProps {
  children: ReactNode;
  rootClass: string;
}

function IconSvg({
  children,
  className,
  id,
  label,
  rootClass,
  size = 20,
}: IconSvgProps) {
  return (
    <svg
      id={id}
      className={`${rootClass}${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {label ? <title>{label}</title> : null}
      {children}
    </svg>
  );
}

export function GoogleIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-google-icon" {...props}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 12h-8v3h4.5c-1.1 2-3 3-5.5 3" />
    </IconSvg>
  );
}

export function SearchIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-search-icon" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </IconSvg>
  );
}

export function CloseIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-close-icon" {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </IconSvg>
  );
}

export function MenuIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-menu-icon" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </IconSvg>
  );
}

export function ChevronDownIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-chevron-down-icon" {...props}>
      <path d="m6 9 6 6 6-6" />
    </IconSvg>
  );
}

export function ChevronLeftIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-chevron-left-icon" {...props}>
      <path d="m15 18-6-6 6-6" />
    </IconSvg>
  );
}

export function ChevronRightIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-chevron-right-icon" {...props}>
      <path d="m9 18 6-6-6-6" />
    </IconSvg>
  );
}

export function ArrowRightIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-arrow-right-icon" {...props}>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </IconSvg>
  );
}

export function CalendarIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-calendar-icon" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </IconSvg>
  );
}

export function ClockIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-clock-icon" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconSvg>
  );
}

export function UserIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-user-icon" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </IconSvg>
  );
}

export function UsersIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-users-icon" {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 4 5" />
    </IconSvg>
  );
}

export function UserAddIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-user-add-icon" {...props}>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6" />
    </IconSvg>
  );
}

export function LogoutIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-logout-icon" {...props}>
      <path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" />
    </IconSvg>
  );
}

export function LockIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-lock-icon" {...props}>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </IconSvg>
  );
}

export function EyeIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-eye-icon" {...props}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </IconSvg>
  );
}

export function EyeOffIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-eye-off-icon" {...props}>
      <path d="m3 3 18 18M10.5 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-2 2.7M6.6 6.6C3.6 8.5 2 12 2 12s3.5 6 10 6a10 10 0 0 0 3.4-.6" />
    </IconSvg>
  );
}

export function CopyIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-copy-icon" {...props}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </IconSvg>
  );
}

export function ExternalLinkIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-external-link-icon" {...props}>
      <path d="M14 4h6v6M20 4 11 13M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </IconSvg>
  );
}

export function EditIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-edit-icon" {...props}>
      <path d="m4 20 4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20Z" />
      <path d="m14.5 7.5 3 3" />
    </IconSvg>
  );
}

export function DeleteIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-delete-icon" {...props}>
      <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
    </IconSvg>
  );
}

export function AddIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-add-icon" {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconSvg>
  );
}

export function RemoveIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-remove-icon" {...props}>
      <path d="M5 12h14" />
    </IconSvg>
  );
}

export function MinusCircleIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-minus-circle-icon" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </IconSvg>
  );
}

export function ReloadIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-reload-icon" {...props}>
      <path d="M20 6v5h-5M4 18v-5h5M18.5 9A7 7 0 0 0 6 6.5L4 11m16 2-2 4.5A7 7 0 0 1 5.5 15" />
    </IconSvg>
  );
}

export function SyncIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-sync-icon" {...props}>
      <path d="M20 7h-9a4 4 0 0 0-4 4M4 17h9a4 4 0 0 0 4-4M17 4l3 3-3 3M7 14l-3 3 3 3" />
    </IconSvg>
  );
}

export function LoadingIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-loading-icon" {...props}>
      <circle cx="12" cy="12" r="9" strokeDasharray="4 4" />
    </IconSvg>
  );
}

export function DownloadIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-download-icon" {...props}>
      <path d="M12 3v12m-5-5 5 5 5-5M5 21h14" />
    </IconSvg>
  );
}

export function SpreadsheetIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-spreadsheet-icon" {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M4 9h16M4 15h16M10 9v12" />
    </IconSvg>
  );
}

export function BugIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-bug-icon" {...props}>
      <rect x="7" y="6" width="10" height="13" rx="5" />
      <path d="M9 6V4M15 6V4M4 10h3M17 10h3M4 15h3M17 15h3M12 10v5" />
    </IconSvg>
  );
}

export function CheckIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-check-icon" {...props}>
      <path d="m5 12 4 4L19 6" />
    </IconSvg>
  );
}

export function CheckCircleIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-check-circle-icon" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </IconSvg>
  );
}

export function WarningIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-warning-icon" {...props}>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9v4M12 17h.01" />
    </IconSvg>
  );
}

export function ErrorIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-error-icon" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </IconSvg>
  );
}

export function InfoIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-info-icon" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </IconSvg>
  );
}

export function DatabaseIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-database-icon" {...props}>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
    </IconSvg>
  );
}

export function CodeIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-code-icon" {...props}>
      <path d="m8 5-6 7 6 7M16 5l6 7-6 7M14 3l-4 18" />
    </IconSvg>
  );
}

export function JsonIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-json-icon" {...props}>
      <path d="M9 3H7a2 2 0 0 0-2 2v4a3 3 0 0 1-2 3 3 3 0 0 1 2 3v4a2 2 0 0 0 2 2h2M15 3h2a2 2 0 0 1 2 2v4a3 3 0 0 0 2 3 3 3 0 0 0-2 3v4a2 2 0 0 1-2 2h-2" />
    </IconSvg>
  );
}

export function LinkIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-link-icon" {...props}>
      <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l2-2" />
    </IconSvg>
  );
}

export function TagIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-tag-icon" {...props}>
      <path d="M20 13 12 21 3 12V3h9l8 8a1.5 1.5 0 0 1 0 2Z" />
      <circle cx="8" cy="8" r="1" />
    </IconSvg>
  );
}

export function TrendUpIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-trend-up-icon" {...props}>
      <path d="m3 17 6-6 4 4 8-9M15 6h6v6" />
    </IconSvg>
  );
}

export function ChartIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-chart-icon" {...props}>
      <path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7M2 20h20" />
    </IconSvg>
  );
}

export function FilterIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-filter-icon" {...props}>
      <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />
    </IconSvg>
  );
}

export function TeamIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-team-icon" {...props}>
      <circle cx="12" cy="7" r="3" />
      <circle cx="5" cy="10" r="2" />
      <circle cx="19" cy="10" r="2" />
      <path d="M7 21a5 5 0 0 1 10 0M1 20a4 4 0 0 1 5-4M23 20a4 4 0 0 0-5-4" />
    </IconSvg>
  );
}

export function ExperimentIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-experiment-icon" {...props}>
      <path d="M9 3h6M10 3v6l-6 10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2L14 9V3M7 15h10" />
    </IconSvg>
  );
}

export function MoreIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-more-icon" {...props}>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </IconSvg>
  );
}

export function HomeIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-home-icon" {...props}>
      <path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7" />
    </IconSvg>
  );
}

export function ReportIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-report-icon" {...props}>
      <path d="M6 3h9l3 3v15H6V3Z" />
      <path d="M14 3v4h4M9 16v2M12 13v5M15 10v8" />
    </IconSvg>
  );
}

export function SettingsIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-settings-icon" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
    </IconSvg>
  );
}

export function HolidayIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-holiday-icon" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18m-9 2 1 2 2 .3-1.5 1.5.4 2.2-1.9-1-1.9 1 .4-2.2L9 14.3l2-.3 1-2Z" />
    </IconSvg>
  );
}

export function TreeIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-tree-icon" {...props}>
      <circle cx="12" cy="4" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="19" r="2" />
      <path d="M12 6v6M6 17v-5h12v5" />
    </IconSvg>
  );
}

export function KeyIcon(props: BerasIconProps) {
  return (
    <IconSvg rootClass="beras-key-icon" {...props}>
      <circle cx="8" cy="15" r="5" />
      <path d="m11.5 11.5 8-8M16 7l2 2M14 9l2 2" />
    </IconSvg>
  );
}
