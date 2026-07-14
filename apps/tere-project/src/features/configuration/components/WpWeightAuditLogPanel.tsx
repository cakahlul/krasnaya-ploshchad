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
import { WEIGHT_KEYS, errorMessage } from './WpWeightConfigPanel.api';
import {
  useWpWeightAuditLog,
  type WPWeightAuditEntry,
} from './WpWeightAuditLogPanel.api';

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

function snapshot(entry: WPWeightAuditEntry) {
  return entry.action === 'create' ? entry.new_value : entry.old_value;
}

export default function WpWeightAuditLogPanel() {
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
  } = useWpWeightAuditLog();
  const entries = data?.pages.flatMap(page => page.items) ?? [];

  const columns: TableColumnsType<WPWeightAuditEntry> = [
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
      render: (value: WPWeightAuditEntry['action']) => (
        <Tag color={value === 'create' ? 'green' : 'red'}>
          {value === 'create' ? 'Create' : 'Delete'}
        </Tag>
      ),
    },
    { title: 'Changed by', dataIndex: 'changed_by', width: 190 },
    {
      title: 'Effective date',
      width: 150,
      render: (_: unknown, entry) => (
        <span style={{ fontFamily: mono }}>
          {snapshot(entry)?.effective_date ?? '—'}
        </span>
      ),
    },
    ...WEIGHT_KEYS.map(key => ({
      title: key,
      width: 115,
      render: (_: unknown, entry: WPWeightAuditEntry) => (
        <span style={{ fontFamily: mono }}>
          {snapshot(entry)?.weights[key] ?? '—'}
        </span>
      ),
    })),
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
      <section aria-labelledby="wp-weight-audit-title" style={{ paddingBottom: 24 }}>
        <div style={{ marginBottom: 14 }}>
          <h2
            id="wp-weight-audit-title"
            style={{
              margin: 0,
              color: colors.titleCol,
              font: `700 18px ${sans}`,
            }}
          >
            WP Weight Audit Log
          </h2>
          <p
            style={{
              margin: '4px 0 0',
              color: colors.subCol,
              font: `12px ${sans}`,
            }}
          >
            Review created and deleted weight configurations.
          </p>
        </div>

        {isLoading ? (
          <div
            role="status"
            aria-live="polite"
            style={{ padding: 32, textAlign: 'center', color: colors.subCol }}
          >
            <Spin size="small" /> Loading WP weight audit activity...
          </div>
        ) : isError && !data ? (
          <Alert
            type="error"
            showIcon
            message="Could not load WP weight audit activity"
            description={errorMessage(error, 'load')}
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
            <Table<WPWeightAuditEntry>
              rowKey="id"
              columns={columns}
              dataSource={entries}
              pagination={false}
              scroll={{ x: 1095 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No WP weight audit activity yet."
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
