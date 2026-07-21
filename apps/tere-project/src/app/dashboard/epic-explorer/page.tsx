'use client';

import { Suspense } from 'react';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import RoleBasedRoute from '@src/components/RoleBasedRoute';
import { useThemeColors } from '@src/hooks/useTheme';
import { useExplorerStore } from '@src/features/epic-explorer/store/explorerStore';
import {
  useEpicDetail,
  useExplorerUrlSync,
} from '@src/features/epic-explorer/hooks/useEpicExplorer';
import { errorStatus, errorMessage } from '@src/features/epic-explorer/api/explorerError';
import ProjectSelect from '@src/features/epic-explorer/components/ProjectSelect';
import EpicSearch from '@src/features/epic-explorer/components/EpicSearch';
import '@src/features/dashboard/components/FilterReport.css';
import EpicInfoCard from '@src/features/epic-explorer/components/EpicInfoCard';
import MetricsPanel from '@src/features/epic-explorer/components/MetricsPanel';
import HierarchyTree from '@src/features/epic-explorer/components/HierarchyTree';
import {
  NotFound,
  NoAccess,
  Unauthorized,
  JiraError,
  EmptyEpic,
  PartialAuthzNote,
} from '@src/features/epic-explorer/components/StateViews';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

function DetailArea() {
  const project = useExplorerStore(s => s.project);
  const epicKey = useExplorerStore(s => s.epicKey);
  const c = useThemeColors();

  const { data, isLoading, isError, error, isFetching, refetch } = useEpicDetail(project, epicKey);

  if (!project || !epicKey) {
    return (
      <p role="status" aria-live="polite" style={{ fontSize: 13, color: c.subCol, fontFamily: sans, marginTop: 24 }}>
        Select a project and an epic to explore its hierarchy and metrics.
      </p>
    );
  }

  let body: React.ReactNode;
  if (isLoading || isFetching) {
    body = (
      <div aria-busy="true">
        {[160, 120, 240].map((h, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{ height: h, borderRadius: 12, background: c.cardBg, border: `1px solid ${c.cardBrd}`, marginBottom: 12 }}
          />
        ))}
      </div>
    );
  } else if (isError) {
    // Error branching strictly on HTTP status — never on empty body (SLS-16813).
    const status = errorStatus(error);
    if (status === 401) body = <Unauthorized />;
    else if (status === 403) body = <NoAccess />;
    else if (status === 404) body = <NotFound />;
    else if (status === 502) body = <JiraError detail={errorMessage(error)} />;
    else body = <JiraError detail={errorMessage(error)} />;
  } else if (!data) {
    body = <JiraError />;
  } else {
    // 200 with no descendants is a real, distinct state — not an error.
    const isEmpty = (data.descendants?.length ?? 0) === 0;
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <EpicInfoCard epic={data.epic} />
        {data.authz?.hiddenCount > 0 && <PartialAuthzNote hiddenCount={data.authz.hiddenCount} />}
        <MetricsPanel metrics={data.metrics} wpConfig={data.wpConfig} />
        {isEmpty ? (
          <EmptyEpic />
        ) : (
          <HierarchyTree descendants={data.descendants} epicKey={data.epic.key} />
        )}
      </div>
    );
  }

  // Toolbar stays mounted across loading/error/success so the refresh button
  // shows its spinner while isFetching (SLS-16896 / FR-08). Double-click safe:
  // React Query dedupes concurrent fetches by the detail query key, and the
  // button is disabled while loading.
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button
          data-qa="explorer-refresh"
          aria-label="Refresh epic detail"
          icon={<ReloadOutlined />}
          loading={isFetching}
          onClick={() => refetch()}
          size="small"
        >
          Refresh
        </Button>
      </div>
      {body}
    </div>
  );
}

function ExplorerContent() {
  const { titleCol, subCol, statusPurpleBg, statusPurpleBrd } = useThemeColors();
  const project = useExplorerStore(s => s.project);
  const epicKey = useExplorerStore(s => s.epicKey);
  useExplorerUrlSync();

  return (
    <div className="p-6 tere-table tere-tabs tere-input">
      <div className="max-w-6xl mx-auto">
        <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            aria-hidden
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              background: statusPurpleBg,
              border: `1px solid ${statusPurpleBrd}`,
              fontSize: 22,
            }}
          >
            🧭
          </span>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: titleCol, margin: 0, fontFamily: sans, letterSpacing: -0.3 }}>
              Epic Explorer
            </h2>
            <p style={{ color: subCol, margin: '4px 0 0', fontSize: 12.5, fontFamily: sans }}>
              Inspect an epic&apos;s child hierarchy and rolled-up metrics
            </p>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-bar__row">
            <ProjectSelect />
            <div className="filter-bar__divider" />
            <EpicSearch />
          </div>
          <div className="filter-bar__hint">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            {!project
              ? 'Select a project to begin'
              : !epicKey
                ? 'Select an epic to view its hierarchy and metrics'
                : `Exploring ${epicKey}`}
          </div>
        </div>

        <DetailArea />
      </div>
    </div>
  );
}

export default function EpicExplorerPage() {
  return (
    <RoleBasedRoute allowedRoles={['Lead', 'Member']}>
      <Suspense fallback={null}>
        <ExplorerContent />
      </Suspense>
    </RoleBasedRoute>
  );
}
