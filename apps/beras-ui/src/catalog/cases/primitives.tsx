'use client';

import { useState, type ComponentType, type ReactNode } from 'react';
import '@krasnaya/beras-ui/styles.css';
import {
  AddIcon,
  ArrowRightIcon,
  Avatar,
  Badge,
  BrandMark,
  BugIcon,
  Button,
  CalendarIcon,
  Card,
  ChartIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CloseIcon,
  CodeBlock,
  CodeIcon,
  CopyIcon,
  DatabaseIcon,
  DeleteIcon,
  Divider,
  DownloadIcon,
  EditIcon,
  ErrorIcon,
  ExperimentIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  FilterIcon,
  GoogleIcon,
  HolidayIcon,
  HomeIcon,
  IconButton,
  InfoIcon,
  JsonIcon,
  KeyIcon,
  LinkIcon,
  LoadingIcon,
  LockIcon,
  LogoutIcon,
  MenuIcon,
  MetricCard,
  MinusCircleIcon,
  MoreIcon,
  ProgressMeter,
  ReloadIcon,
  RemoveIcon,
  ReportIcon,
  SearchIcon,
  SecretField,
  SettingsIcon,
  SpreadsheetIcon,
  StatGrid,
  StatusBadge,
  SyncIcon,
  Tag,
  TagIcon,
  TeamIcon,
  TreeIcon,
  TrendUpIcon,
  UserAddIcon,
  UserIcon,
  UsersIcon,
  WarningIcon,
} from '@krasnaya/beras-ui/components';
import type {
  ActionHandler,
  BerasIconProps,
  ButtonProps,
} from '@krasnaya/beras-ui/types';
import { primitiveFixtures } from '../../fixtures/primitives';

interface CatalogCaseManifestEntry {
  id: `${string}/${string}/${string}`;
  fixtureId: `fixture:${string}`;
}

interface CatalogRuntimeCase {
  id: CatalogCaseManifestEntry['id'];
  fixtureId: CatalogCaseManifestEntry['fixtureId'];
  render: () => ReactNode;
}

interface ActionFixture {
  readonly actionId: string;
  readonly label: string;
  readonly variant: NonNullable<ButtonProps['variant']>;
  readonly tone: NonNullable<ButtonProps['tone']>;
  readonly size: NonNullable<ButtonProps['size']>;
  readonly disabled?: boolean;
  readonly pending?: boolean;
  readonly note: string;
}

function Preview({ children, label }: { children: ReactNode; label: string }) {
  return (
    <section data-beras-root aria-label={label}>
      <h2>{label}</h2>
      {children}
    </section>
  );
}

function ActionPreview({
  fixture,
  icon,
}: {
  fixture: ActionFixture;
  icon: ReactNode;
}) {
  const [event, setEvent] = useState('No action emitted');
  const onAction: ActionHandler = (actionId, meta) => {
    setEvent(`${actionId} via ${meta.source}`);
  };

  return (
    <Preview label={fixture.label}>
      <Button
        actionId={fixture.actionId}
        variant={fixture.variant}
        tone={fixture.tone}
        size={fixture.size}
        disabled={fixture.disabled}
        pending={fixture.pending}
        onAction={onAction}
      >
        {icon}
        <span>{fixture.label}</span>
      </Button>
      <p>{fixture.note}</p>
      <output aria-live="polite">{event}</output>
    </Preview>
  );
}

function IconButtonPreview({
  fixture,
}: {
  fixture: typeof primitiveFixtures['fixture:primitive/icon-button/default'];
}) {
  const [event, setEvent] = useState('No action emitted');
  const onAction: ActionHandler = (actionId, meta) => {
    setEvent(`${actionId} via ${meta.source}`);
  };

  return (
    <Preview label={fixture.label}>
      <IconButton
        actionId={fixture.actionId}
        icon={<SearchIcon />}
        label={fixture.label}
        onAction={onAction}
      />
      <output aria-live="polite">{event}</output>
    </Preview>
  );
}

function RemovableTagPreview({
  fixture,
}: {
  fixture: typeof primitiveFixtures['fixture:primitive/tag/default'];
}) {
  const [event, setEvent] = useState('No action emitted');
  const onAction: ActionHandler = (actionId, meta) => {
    setEvent(`${actionId} via ${meta.source}`);
  };

  return (
    <Preview label="Tag">
      <Tag
        tone={fixture.tone}
        removable={fixture.removable}
        onAction={onAction}
      >
        {fixture.label}
      </Tag>
      <output aria-live="polite">{event}</output>
    </Preview>
  );
}

function SecretFieldPreview({
  fixture,
}: {
  fixture: typeof primitiveFixtures['fixture:primitive/secret-field/default'];
}) {
  const [revealed, setRevealed] = useState<boolean>(fixture.revealed);
  const [event, setEvent] = useState('No action emitted');
  const onAction: ActionHandler = (actionId, meta) => {
    if (actionId === 'reveal') setRevealed((current) => !current);
    setEvent(
      actionId === 'reveal'
        ? `${revealed ? 'Concealed' : 'Revealed'} via ${meta.source}`
        : `${actionId} via ${meta.source}`,
    );
  };
  const actions = fixture.actions.map((action) =>
    action.id === 'reveal'
      ? { ...action, label: revealed ? 'Conceal' : 'Reveal' }
      : action,
  );

  return (
    <Preview label={fixture.label}>
      <SecretField
        label={fixture.label}
        value={fixture.value}
        revealed={revealed}
        actions={actions}
        onAction={onAction}
      />
      <output aria-live="polite">{event}</output>
    </Preview>
  );
}

function IconPreview({
  Icon,
  label,
}: {
  Icon: ComponentType<BerasIconProps>;
  label: string;
}) {
  return (
    <Preview label={`${label} icon`}>
      <figure>
        <Icon label={label} size={28} />
        <figcaption>Informative icon: {label}</figcaption>
      </figure>
      <figure>
        <Icon size={28} />
        <figcaption>Decorative copy: hidden from assistive technology</figcaption>
      </figure>
    </Preview>
  );
}

export const primitiveCases: readonly CatalogRuntimeCase[] = [
  {
    id: 'primitive/brand-mark/default',
    fixtureId: 'fixture:primitive/brand-mark/default',
    render: () => {
      const fixture = primitiveFixtures['fixture:primitive/brand-mark/default'];
      return (
        <Preview label={fixture.label}>
          <BrandMark label={fixture.label} compact={fixture.compact} />
        </Preview>
      );
    },
  },
  {
    id: 'primitive/brand-mark/compact',
    fixtureId: 'fixture:primitive/brand-mark/compact',
    render: () => {
      const fixture = primitiveFixtures['fixture:primitive/brand-mark/compact'];
      return (
        <Preview label={`${fixture.label} compact`}>
          <BrandMark label={fixture.label} compact={fixture.compact} />
        </Preview>
      );
    },
  },
  {
    id: 'primitive/oauth-button/default',
    fixtureId: 'fixture:primitive/oauth-button/default',
    render: () => (
      <ActionPreview
        fixture={primitiveFixtures['fixture:primitive/oauth-button/default']}
        icon={<GoogleIcon />}
      />
    ),
  },
  {
    id: 'primitive/oauth-button/focus',
    fixtureId: 'fixture:primitive/oauth-button/focus',
    render: () => (
      <ActionPreview
        fixture={primitiveFixtures['fixture:primitive/oauth-button/focus']}
        icon={<GoogleIcon />}
      />
    ),
  },
  {
    id: 'primitive/oauth-button/disabled',
    fixtureId: 'fixture:primitive/oauth-button/disabled',
    render: () => (
      <ActionPreview
        fixture={primitiveFixtures['fixture:primitive/oauth-button/disabled']}
        icon={<GoogleIcon />}
      />
    ),
  },
  {
    id: 'primitive/oauth-button/pending',
    fixtureId: 'fixture:primitive/oauth-button/pending',
    render: () => (
      <ActionPreview
        fixture={primitiveFixtures['fixture:primitive/oauth-button/pending']}
        icon={<GoogleIcon />}
      />
    ),
  },
  {
    id: 'primitive/export-button/disabled',
    fixtureId: 'fixture:primitive/export-button/disabled',
    render: () => (
      <ActionPreview
        fixture={primitiveFixtures['fixture:primitive/export-button/disabled']}
        icon={<SpreadsheetIcon />}
      />
    ),
  },
  {
    id: 'primitive/export-button/default',
    fixtureId: 'fixture:primitive/export-button/default',
    render: () => (
      <ActionPreview
        fixture={primitiveFixtures['fixture:primitive/export-button/default']}
        icon={<SpreadsheetIcon />}
      />
    ),
  },
  {
    id: 'primitive/export-button/pending',
    fixtureId: 'fixture:primitive/export-button/pending',
    render: () => (
      <ActionPreview
        fixture={primitiveFixtures['fixture:primitive/export-button/pending']}
        icon={<SpreadsheetIcon />}
      />
    ),
  },
  {
    id: 'primitive/export-button/success',
    fixtureId: 'fixture:primitive/export-button/success',
    render: () => (
      <ActionPreview
        fixture={primitiveFixtures['fixture:primitive/export-button/success']}
        icon={<CheckCircleIcon />}
      />
    ),
  },
  {
    id: 'primitive/export-button/failure',
    fixtureId: 'fixture:primitive/export-button/failure',
    render: () => (
      <ActionPreview
        fixture={primitiveFixtures['fixture:primitive/export-button/failure']}
        icon={<ErrorIcon />}
      />
    ),
  },
  {
    id: 'primitive/export-button/reduced-motion',
    fixtureId: 'fixture:primitive/export-button/reduced-motion',
    render: () => (
      <ActionPreview
        fixture={primitiveFixtures['fixture:primitive/export-button/reduced-motion']}
        icon={<SpreadsheetIcon />}
      />
    ),
  },
  {
    id: 'primitive/status-badge/neutral',
    fixtureId: 'fixture:primitive/status-badge/neutral',
    render: () => {
      const fixture = primitiveFixtures['fixture:primitive/status-badge/neutral'];
      return (
        <Preview label="Neutral status">
          <StatusBadge tone={fixture.tone}>{fixture.label}</StatusBadge>
        </Preview>
      );
    },
  },
  {
    id: 'primitive/status-badge/info',
    fixtureId: 'fixture:primitive/status-badge/info',
    render: () => {
      const fixture = primitiveFixtures['fixture:primitive/status-badge/info'];
      return (
        <Preview label="Information status">
          <StatusBadge tone={fixture.tone}>{fixture.label}</StatusBadge>
        </Preview>
      );
    },
  },
  {
    id: 'primitive/status-badge/success',
    fixtureId: 'fixture:primitive/status-badge/success',
    render: () => {
      const fixture = primitiveFixtures['fixture:primitive/status-badge/success'];
      return (
        <Preview label="Success status">
          <StatusBadge tone={fixture.tone}>{fixture.label}</StatusBadge>
        </Preview>
      );
    },
  },
  {
    id: 'primitive/status-badge/warning',
    fixtureId: 'fixture:primitive/status-badge/warning',
    render: () => {
      const fixture = primitiveFixtures['fixture:primitive/status-badge/warning'];
      return (
        <Preview label="Warning status">
          <StatusBadge tone={fixture.tone}>{fixture.label}</StatusBadge>
        </Preview>
      );
    },
  },
  {
    id: 'primitive/status-badge/danger',
    fixtureId: 'fixture:primitive/status-badge/danger',
    render: () => {
      const fixture = primitiveFixtures['fixture:primitive/status-badge/danger'];
      return (
        <Preview label="Danger status">
          <StatusBadge tone={fixture.tone}>{fixture.label}</StatusBadge>
        </Preview>
      );
    },
  },
  {
    id: 'primitive/status-badge/long-label',
    fixtureId: 'fixture:primitive/status-badge/long-label',
    render: () => {
      const fixture = primitiveFixtures['fixture:primitive/status-badge/long-label'];
      return (
        <Preview label="Long status label">
          <StatusBadge tone={fixture.tone}>{fixture.label}</StatusBadge>
        </Preview>
      );
    },
  },
  {
    id: 'primitive/icon-button/default',
    fixtureId: 'fixture:primitive/icon-button/default',
    render: () => {
      const fixture = primitiveFixtures['fixture:primitive/icon-button/default'];
      return <IconButtonPreview fixture={fixture} />;
    },
  },
  {
    id: 'primitive/badge/default',
    fixtureId: 'fixture:primitive/badge/default',
    render: () => {
      const fixture = primitiveFixtures['fixture:primitive/badge/default'];
      return (
        <Preview label="Badge">
          <Badge tone={fixture.tone}>{fixture.label}</Badge>
        </Preview>
      );
    },
  },
  {
    id: 'primitive/tag/default',
    fixtureId: 'fixture:primitive/tag/default',
    render: () => {
      const fixture = primitiveFixtures['fixture:primitive/tag/default'];
      return <RemovableTagPreview fixture={fixture} />;
    },
  },
  {
    id: 'primitive/avatar/default',
    fixtureId: 'fixture:primitive/avatar/default',
    render: () => {
      const fixture = primitiveFixtures['fixture:primitive/avatar/default'];
      return (
        <Preview label="Avatar">
          <Avatar
            name={fixture.name}
            initials={fixture.initials}
            size={fixture.size}
          />
        </Preview>
      );
    },
  },
  {
    id: 'primitive/card/default',
    fixtureId: 'fixture:primitive/card/default',
    render: () => {
      const fixture = primitiveFixtures['fixture:primitive/card/default'];
      return (
        <Preview label="Card">
          <Card title={fixture.title}>{fixture.content}</Card>
        </Preview>
      );
    },
  },
  {
    id: 'primitive/metric-card/default',
    fixtureId: 'fixture:primitive/metric-card/default',
    render: () => {
      const fixture = primitiveFixtures['fixture:primitive/metric-card/default'];
      return <MetricCard {...fixture} />;
    },
  },
  {
    id: 'primitive/stat-grid/default',
    fixtureId: 'fixture:primitive/stat-grid/default',
    render: () => (
      <Preview label="Statistic grid">
        <StatGrid items={primitiveFixtures['fixture:primitive/stat-grid/default'].items} />
      </Preview>
    ),
  },
  {
    id: 'primitive/progress-meter/default',
    fixtureId: 'fixture:primitive/progress-meter/default',
    render: () => (
      <Preview label="Progress meter">
        <ProgressMeter
          {...primitiveFixtures['fixture:primitive/progress-meter/default']}
        />
      </Preview>
    ),
  },
  {
    id: 'primitive/divider/default',
    fixtureId: 'fixture:primitive/divider/default',
    render: () => (
      <Preview label="Divider">
        <Divider {...primitiveFixtures['fixture:primitive/divider/default']} />
      </Preview>
    ),
  },
  {
    id: 'primitive/code-block/default',
    fixtureId: 'fixture:primitive/code-block/default',
    render: () => (
      <Preview label="Code block">
        <CodeBlock {...primitiveFixtures['fixture:primitive/code-block/default']} />
      </Preview>
    ),
  },
  {
    id: 'primitive/code-block/long-content',
    fixtureId: 'fixture:primitive/code-block/long-content',
    render: () => (
      <Preview label="Long code block">
        <CodeBlock
          {...primitiveFixtures['fixture:primitive/code-block/long-content']}
        />
      </Preview>
    ),
  },
  {
    id: 'primitive/secret-field/default',
    fixtureId: 'fixture:primitive/secret-field/default',
    render: () => (
      <SecretFieldPreview
        fixture={primitiveFixtures['fixture:primitive/secret-field/default']}
      />
    ),
  },
  {
    id: 'primitive/google-icon/default',
    fixtureId: 'fixture:primitive/google-icon/default',
    render: () => <IconPreview Icon={GoogleIcon} label="Google" />,
  },
  {
    id: 'primitive/search-icon/default',
    fixtureId: 'fixture:primitive/search-icon/default',
    render: () => <IconPreview Icon={SearchIcon} label="Search" />,
  },
  {
    id: 'primitive/close-icon/default',
    fixtureId: 'fixture:primitive/close-icon/default',
    render: () => <IconPreview Icon={CloseIcon} label="Close" />,
  },
  {
    id: 'primitive/menu-icon/default',
    fixtureId: 'fixture:primitive/menu-icon/default',
    render: () => <IconPreview Icon={MenuIcon} label="Menu" />,
  },
  {
    id: 'primitive/chevron-down-icon/default',
    fixtureId: 'fixture:primitive/chevron-down-icon/default',
    render: () => <IconPreview Icon={ChevronDownIcon} label="Expand" />,
  },
  {
    id: 'primitive/chevron-left-icon/default',
    fixtureId: 'fixture:primitive/chevron-left-icon/default',
    render: () => <IconPreview Icon={ChevronLeftIcon} label="Previous" />,
  },
  {
    id: 'primitive/chevron-right-icon/default',
    fixtureId: 'fixture:primitive/chevron-right-icon/default',
    render: () => <IconPreview Icon={ChevronRightIcon} label="Next" />,
  },
  {
    id: 'primitive/arrow-right-icon/default',
    fixtureId: 'fixture:primitive/arrow-right-icon/default',
    render: () => <IconPreview Icon={ArrowRightIcon} label="Continue" />,
  },
  {
    id: 'primitive/calendar-icon/default',
    fixtureId: 'fixture:primitive/calendar-icon/default',
    render: () => <IconPreview Icon={CalendarIcon} label="Calendar" />,
  },
  {
    id: 'primitive/clock-icon/default',
    fixtureId: 'fixture:primitive/clock-icon/default',
    render: () => <IconPreview Icon={ClockIcon} label="Time" />,
  },
  {
    id: 'primitive/user-icon/default',
    fixtureId: 'fixture:primitive/user-icon/default',
    render: () => <IconPreview Icon={UserIcon} label="User" />,
  },
  {
    id: 'primitive/users-icon/default',
    fixtureId: 'fixture:primitive/users-icon/default',
    render: () => <IconPreview Icon={UsersIcon} label="Users" />,
  },
  {
    id: 'primitive/user-add-icon/default',
    fixtureId: 'fixture:primitive/user-add-icon/default',
    render: () => <IconPreview Icon={UserAddIcon} label="Add user" />,
  },
  {
    id: 'primitive/logout-icon/default',
    fixtureId: 'fixture:primitive/logout-icon/default',
    render: () => <IconPreview Icon={LogoutIcon} label="Sign out" />,
  },
  {
    id: 'primitive/lock-icon/default',
    fixtureId: 'fixture:primitive/lock-icon/default',
    render: () => <IconPreview Icon={LockIcon} label="Locked" />,
  },
  {
    id: 'primitive/eye-icon/default',
    fixtureId: 'fixture:primitive/eye-icon/default',
    render: () => <IconPreview Icon={EyeIcon} label="Show" />,
  },
  {
    id: 'primitive/eye-off-icon/default',
    fixtureId: 'fixture:primitive/eye-off-icon/default',
    render: () => <IconPreview Icon={EyeOffIcon} label="Hide" />,
  },
  {
    id: 'primitive/copy-icon/default',
    fixtureId: 'fixture:primitive/copy-icon/default',
    render: () => <IconPreview Icon={CopyIcon} label="Copy" />,
  },
  {
    id: 'primitive/external-link-icon/default',
    fixtureId: 'fixture:primitive/external-link-icon/default',
    render: () => <IconPreview Icon={ExternalLinkIcon} label="Open external link" />,
  },
  {
    id: 'primitive/edit-icon/default',
    fixtureId: 'fixture:primitive/edit-icon/default',
    render: () => <IconPreview Icon={EditIcon} label="Edit" />,
  },
  {
    id: 'primitive/delete-icon/default',
    fixtureId: 'fixture:primitive/delete-icon/default',
    render: () => <IconPreview Icon={DeleteIcon} label="Delete" />,
  },
  {
    id: 'primitive/add-icon/default',
    fixtureId: 'fixture:primitive/add-icon/default',
    render: () => <IconPreview Icon={AddIcon} label="Add" />,
  },
  {
    id: 'primitive/remove-icon/default',
    fixtureId: 'fixture:primitive/remove-icon/default',
    render: () => <IconPreview Icon={RemoveIcon} label="Remove" />,
  },
  {
    id: 'primitive/minus-circle-icon/default',
    fixtureId: 'fixture:primitive/minus-circle-icon/default',
    render: () => <IconPreview Icon={MinusCircleIcon} label="Remove item" />,
  },
  {
    id: 'primitive/reload-icon/default',
    fixtureId: 'fixture:primitive/reload-icon/default',
    render: () => <IconPreview Icon={ReloadIcon} label="Reload" />,
  },
  {
    id: 'primitive/sync-icon/default',
    fixtureId: 'fixture:primitive/sync-icon/default',
    render: () => <IconPreview Icon={SyncIcon} label="Synchronize" />,
  },
  {
    id: 'primitive/loading-icon/default',
    fixtureId: 'fixture:primitive/loading-icon/default',
    render: () => <IconPreview Icon={LoadingIcon} label="Loading" />,
  },
  {
    id: 'primitive/download-icon/default',
    fixtureId: 'fixture:primitive/download-icon/default',
    render: () => <IconPreview Icon={DownloadIcon} label="Download" />,
  },
  {
    id: 'primitive/spreadsheet-icon/default',
    fixtureId: 'fixture:primitive/spreadsheet-icon/default',
    render: () => <IconPreview Icon={SpreadsheetIcon} label="Spreadsheet" />,
  },
  {
    id: 'primitive/bug-icon/default',
    fixtureId: 'fixture:primitive/bug-icon/default',
    render: () => <IconPreview Icon={BugIcon} label="Bug" />,
  },
  {
    id: 'primitive/check-icon/default',
    fixtureId: 'fixture:primitive/check-icon/default',
    render: () => <IconPreview Icon={CheckIcon} label="Done" />,
  },
  {
    id: 'primitive/check-circle-icon/default',
    fixtureId: 'fixture:primitive/check-circle-icon/default',
    render: () => <IconPreview Icon={CheckCircleIcon} label="Completed" />,
  },
  {
    id: 'primitive/warning-icon/default',
    fixtureId: 'fixture:primitive/warning-icon/default',
    render: () => <IconPreview Icon={WarningIcon} label="Warning" />,
  },
  {
    id: 'primitive/error-icon/default',
    fixtureId: 'fixture:primitive/error-icon/default',
    render: () => <IconPreview Icon={ErrorIcon} label="Error" />,
  },
  {
    id: 'primitive/info-icon/default',
    fixtureId: 'fixture:primitive/info-icon/default',
    render: () => <IconPreview Icon={InfoIcon} label="Information" />,
  },
  {
    id: 'primitive/database-icon/default',
    fixtureId: 'fixture:primitive/database-icon/default',
    render: () => <IconPreview Icon={DatabaseIcon} label="Database" />,
  },
  {
    id: 'primitive/code-icon/default',
    fixtureId: 'fixture:primitive/code-icon/default',
    render: () => <IconPreview Icon={CodeIcon} label="Code" />,
  },
  {
    id: 'primitive/json-icon/default',
    fixtureId: 'fixture:primitive/json-icon/default',
    render: () => <IconPreview Icon={JsonIcon} label="JSON" />,
  },
  {
    id: 'primitive/link-icon/default',
    fixtureId: 'fixture:primitive/link-icon/default',
    render: () => <IconPreview Icon={LinkIcon} label="Link" />,
  },
  {
    id: 'primitive/tag-icon/default',
    fixtureId: 'fixture:primitive/tag-icon/default',
    render: () => <IconPreview Icon={TagIcon} label="Tag" />,
  },
  {
    id: 'primitive/trend-up-icon/default',
    fixtureId: 'fixture:primitive/trend-up-icon/default',
    render: () => <IconPreview Icon={TrendUpIcon} label="Upward trend" />,
  },
  {
    id: 'primitive/chart-icon/default',
    fixtureId: 'fixture:primitive/chart-icon/default',
    render: () => <IconPreview Icon={ChartIcon} label="Chart" />,
  },
  {
    id: 'primitive/filter-icon/default',
    fixtureId: 'fixture:primitive/filter-icon/default',
    render: () => <IconPreview Icon={FilterIcon} label="Filter" />,
  },
  {
    id: 'primitive/team-icon/default',
    fixtureId: 'fixture:primitive/team-icon/default',
    render: () => <IconPreview Icon={TeamIcon} label="Team" />,
  },
  {
    id: 'primitive/experiment-icon/default',
    fixtureId: 'fixture:primitive/experiment-icon/default',
    render: () => <IconPreview Icon={ExperimentIcon} label="Experiment" />,
  },
  {
    id: 'primitive/more-icon/default',
    fixtureId: 'fixture:primitive/more-icon/default',
    render: () => <IconPreview Icon={MoreIcon} label="More options" />,
  },
  {
    id: 'primitive/home-icon/default',
    fixtureId: 'fixture:primitive/home-icon/default',
    render: () => <IconPreview Icon={HomeIcon} label="Home" />,
  },
  {
    id: 'primitive/report-icon/default',
    fixtureId: 'fixture:primitive/report-icon/default',
    render: () => <IconPreview Icon={ReportIcon} label="Report" />,
  },
  {
    id: 'primitive/settings-icon/default',
    fixtureId: 'fixture:primitive/settings-icon/default',
    render: () => <IconPreview Icon={SettingsIcon} label="Settings" />,
  },
  {
    id: 'primitive/holiday-icon/default',
    fixtureId: 'fixture:primitive/holiday-icon/default',
    render: () => <IconPreview Icon={HolidayIcon} label="Holiday" />,
  },
  {
    id: 'primitive/tree-icon/default',
    fixtureId: 'fixture:primitive/tree-icon/default',
    render: () => <IconPreview Icon={TreeIcon} label="Issue tree" />,
  },
  {
    id: 'primitive/key-icon/default',
    fixtureId: 'fixture:primitive/key-icon/default',
    render: () => <IconPreview Icon={KeyIcon} label="Key" />,
  },
];
