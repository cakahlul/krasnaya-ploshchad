'use client';

import RoleBasedRoute from '@src/components/RoleBasedRoute';
import { useThemeColors } from '@src/hooks/useTheme';
import { useExplorerStore } from '@src/features/epic-explorer/store/explorerStore';
import { useEpicDetail } from '@src/features/epic-explorer/hooks/useEpicExplorer';
import { errorStatus, errorMessage } from '@src/features/epic-explorer/api/explorerError';
import ProjectSelect from '@src/features/epic-explorer/components/ProjectSelect';
import EpicSearch from '@src/features/epic-explorer/components/EpicSearch';
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

  const { data, isLoading, isError, error, isFetching } = useEpicDetail(project, epicKey);

  if (!project || !epicKey) {
    return (
      <p role="status" aria-live="polite" style={{ fontSize: 13, color: c.subCol, fontFamily: sans, marginTop: 24 }}>
        Select a project and an epic to explore its hierarchy and metrics.
      </p>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div style={{ marginTop: 16 }} aria-busy="true">
        {[160, 120, 240].map((h, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{ height: h, borderRadius: 12, background: c.cardBg, border: `1px solid ${c.cardBrd}`, marginBottom: 12 }}
          />
        ))}
      </div>
    );
  }

  // Error branching strictly on HTTP status — never on empty body (SLS-16813).
  if (isError) {
    const status = errorStatus(error);
    if (status === 401) return <Unauthorized />;
    if (status === 403) return <NoAccess />;
    if (status === 404) return <NotFound />;
    if (status === 502) return <JiraError detail={errorMessage(error)} />;
    return <JiraError detail={errorMessage(error)} />;
  }

  if (!data) return <JiraError />;

  // 200 with no descendants is a real, distinct state — not an error.
  const isEmpty = (data.descendants?.length ?? 0) === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
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

export default function EpicExplorerPage() {
  const { titleCol, subCol } = useThemeColors();

  return (
    <RoleBasedRoute allowedRoles={['Lead', 'Member']}>
      <div className="p-6 tere-table tere-tabs tere-input">
        <div className="max-w-6xl mx-auto">
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: titleCol, margin: 0, fontFamily: sans, letterSpacing: -0.3 }}>
              Epic Explorer
            </h2>
            <p style={{ color: subCol, margin: '4px 0 0', fontSize: 12.5, fontFamily: sans }}>
              Inspect an epic&apos;s child hierarchy and rolled-up metrics
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
            <ProjectSelect />
            <EpicSearch />
          </div>

          <DetailArea />
        </div>
      </div>
    </RoleBasedRoute>
  );
}
