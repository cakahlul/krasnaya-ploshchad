'use client';

import {
  Alert,
  Button,
  ConfigProvider,
  Empty,
  Spin,
  Table,
  Tag,
  type TableColumnsType,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useThemeColors } from '@src/hooks/useTheme';
import {
  configAuditErrorMessage,
  useConfigAuditLog,
  type ConfigAuditEntityType,
  type ConfigAuditEntry,
} from './ConfigAuditLogPanel.api';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";
const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";
const changedAtFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

interface ConfigAuditLogPanelProps<T> {
  entityType: ConfigAuditEntityType;
  label: string;
  snapshotColumns: TableColumnsType<ConfigAuditEntry<T>>;
}

export default function ConfigAuditLogPanel<T>({
  entityType,
  label,
  snapshotColumns,
}: ConfigAuditLogPanelProps<T>) {
  const colors = useThemeColors();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoading,
    refetch,
  } = useConfigAuditLog<T>(entityType);
  const entries = data?.pages.flatMap(page => page.items) ?? [];
  const titleId = `${entityType}-audit-title`;

  const columns: TableColumnsType<ConfigAuditEntry<T>> = [
    {
      title: 'Changed at',
      dataIndex: 'changed_at',
      width: 210,
      render: (value: string) => (
        <time dateTime={value} style={{ fontFamily: mono }}>
          {changedAtFormatter.format(new Date(value))} WIB
        </time>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 100,
      render: (value: ConfigAuditEntry<T>['action']) => (
        <Tag color={value === 'create' ? 'green' : 'red'}>
          {value === 'create' ? 'Create' : 'Delete'}
        </Tag>
      ),
    },
    { title: 'Changed by', dataIndex: 'changed_by', width: 190 },
    ...snapshotColumns,
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: colors.accent,
          colorBgContainer: colors.cardBg,
          colorBorder: colors.cardBrd,
          colorText: colors.rowCol,
          colorTextSecondary: colors.subCol,
          fontFamily: sans,
        },
      }}
    >
      <section aria-labelledby={titleId} style={{ paddingBottom: 24 }}>
        <div style={{ marginBottom: 14 }}>
          <h2
            id={titleId}
            style={{
              margin: 0,
              color: colors.titleCol,
              font: `700 18px ${sans}`,
            }}
          >
            {label} Audit Log
          </h2>
          <p
            style={{
              margin: '4px 0 0',
              color: colors.subCol,
              font: `12px ${sans}`,
            }}
          >
            Review created and deleted {label} configurations.
          </p>
        </div>

        {isLoading ? (
          <div
            role="status"
            aria-live="polite"
            style={{ padding: 32, textAlign: 'center', color: colors.subCol }}
          >
            <Spin size="small" /> Loading {label} audit activity...
          </div>
        ) : isError && !data ? (
          <Alert
            type="error"
            showIcon
            message={`Could not load ${label} audit activity`}
            description={configAuditErrorMessage(error, label)}
            action={
              <Button
                icon={<ReloadOutlined aria-hidden />}
                loading={isFetching}
                onClick={() => refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : (
          <>
            <Table<ConfigAuditEntry<T>>
              rowKey="id"
              columns={columns}
              dataSource={entries}
              pagination={false}
              scroll={{ x: 1095 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={`No ${label} audit activity yet.`}
                  />
                ),
              }}
            />

            {isFetchNextPageError && (
              <Alert
                type="error"
                showIcon
                style={{ marginTop: 12 }}
                message="Could not load more audit activity"
                action={
                  <Button
                    icon={<ReloadOutlined aria-hidden />}
                    loading={isFetchingNextPage}
                    onClick={() => fetchNextPage()}
                  >
                    Retry
                  </Button>
                }
              />
            )}

            {hasNextPage && !isFetchNextPageError && (
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <Button
                  disabled={isFetchingNextPage}
                  loading={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  {isFetchingNextPage ? 'Loading more...' : 'Load more'}
                </Button>
                {isFetchingNextPage && (
                  <span role="status" aria-live="polite" style={{ marginLeft: 8 }}>
                    Loading more audit activity...
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </ConfigProvider>
  );
}
