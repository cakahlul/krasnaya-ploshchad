'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  ConfigProvider,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Table,
  Tag,
  Typography,
  message,
  type TableColumnsType,
} from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useThemeColors } from '@src/hooks/useTheme';
import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';
import {
  errorMessage,
  findActiveConfig,
  isPastDate,
  rateKeysFrom,
  useCreateTargetWpConfig,
  useDeleteTargetWpConfig,
  useTargetWpConfigs,
  type TargetWpConfig,
  type TargetWpRates,
} from './TargetWpConfigPanel.api';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";
const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";

type FormValues = { effective_date: string } & Record<string, string>;

function todayWib(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(item => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function tomorrowWib(): string {
  const date = new Date(`${todayWib()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function isFutureWibDate(value: string, now = new Date()): boolean {
  return value > todayWib(now);
}

function parseRate(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const rate = Number(normalized);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

export default function TargetWpConfigPanel() {
  const [form] = Form.useForm<FormValues>();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const today = todayWib();
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useTargetWpConfigs();
  const createConfig = useCreateTargetWpConfig();
  const deleteConfig = useDeleteTargetWpConfig();
  const colors = useThemeColors();
  const { member } = useMemberProfile();
  const isLead = Boolean(member?.isLead);

  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.effective_date.localeCompare(a.effective_date)),
    [data],
  );
  const activeConfig = useMemo(
    () => findActiveConfig(sortedData, today),
    [sortedData, today],
  );
  const rateKeys = useMemo(() => rateKeysFrom(data), [data]);

  const handleCreate = async (values: FormValues) => {
    if (!isFutureWibDate(values.effective_date)) {
      form.setFields([
        {
          name: 'effective_date',
          errors: ['Choose a date after today in Jakarta time.'],
        },
      ]);
      return;
    }

    const rates = Object.fromEntries(
      rateKeys.map(key => [key, parseRate(values[key])]),
    ) as TargetWpRates;

    try {
      await createConfig.mutateAsync({
        effective_date: values.effective_date,
        rates,
      });
      message.success('Target WP configuration created.');
      form.resetFields();
      setCreateOpen(false);
    } catch (mutationError) {
      message.error(errorMessage(mutationError, 'create'));
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfig.isPending) return;
    try {
      await deleteConfig.mutateAsync(id);
      message.success('Target WP configuration deleted.');
    } catch (mutationError) {
      message.error(errorMessage(mutationError, 'delete'));
    }
  };

  const columns: TableColumnsType<TargetWpConfig> = [
    {
      title: 'Effective date',
      dataIndex: 'effective_date',
      width: 150,
      render: (value: string, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: mono }}>{value}</span>
          {record.id === activeConfig?.id && <Tag color="green">Aktif</Tag>}
          {isPastDate(record.effective_date, today) && <Tag>Sudah lewat</Tag>}
        </div>
      ),
    },
    ...rateKeys.map(key => ({
      title: key,
      width: 130,
      render: (_: unknown, record: TargetWpConfig) => (
        <span style={{ fontFamily: mono }}>{record.rates[key] ?? '—'}</span>
      ),
    })),
    {
      title: 'Action',
      key: 'action',
      width: 130,
      fixed: 'right' as const,
      render: (_: unknown, record: TargetWpConfig) => {
        if (!isLead) return <Typography.Text type="secondary">—</Typography.Text>;
        if (record.id === activeConfig?.id) {
          return <Typography.Text type="secondary">Aktif</Typography.Text>;
        }
        const past = isPastDate(record.effective_date, today);
        return (
          <Popconfirm
            title="Delete target WP configuration?"
            description={
              past
                ? 'This configuration has already taken effect and may have historical calculation usage. It will be permanently removed.'
                : 'This scheduled configuration will be permanently removed.'
            }
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{
              danger: true,
              loading:
                deleteConfig.isPending && deleteConfig.variables === record.id,
            }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              danger
              type="text"
              icon={<DeleteOutlined aria-hidden />}
              disabled={deleteConfig.isPending}
              aria-label={`Delete configuration effective ${record.effective_date}`}
            >
              Delete
            </Button>
          </Popconfirm>
        );
      },
    },
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
      <section
        aria-labelledby="target-wp-config-title"
        style={{ paddingBottom: 24 }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <h2
              id="target-wp-config-title"
              style={{
                margin: 0,
                color: colors.titleCol,
                font: `700 18px ${sans}`,
              }}
            >
              Target WP Configuration
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                color: colors.subCol,
                font: `12px ${sans}`,
              }}
            >
              Schedule the target WP rate assigned to each level.
            </p>
          </div>
          {isLead && (
            <Button
              type="primary"
              icon={<PlusOutlined aria-hidden />}
              onClick={() => setCreateOpen(true)}
            >
              Add configuration
            </Button>
          )}
        </div>

        {isError ? (
          <Alert
            type="error"
            showIcon
            message="Could not load target WP configurations"
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
          <Table<TargetWpConfig>
            rowKey="id"
            columns={columns}
            dataSource={sortedData}
            loading={{ spinning: isLoading, tip: 'Loading configurations...' }}
            pagination={false}
            scroll={{ x: 760 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No target WP configurations yet. Add one with a future effective date."
                />
              ),
            }}
          />
        )}

        <Modal
          title="Add target WP configuration"
          open={isCreateOpen}
          onCancel={() => !createConfig.isPending && setCreateOpen(false)}
          okText="Create"
          cancelText="Cancel"
          confirmLoading={createConfig.isPending}
          cancelButtonProps={{ disabled: createConfig.isPending }}
          closable={!createConfig.isPending}
          maskClosable={!createConfig.isPending}
          keyboard={!createConfig.isPending}
          onOk={() => form.submit()}
          destroyOnHidden
        >
          <Form<FormValues>
            form={form}
            layout="vertical"
            onFinish={handleCreate}
            requiredMark="optional"
          >
            <Form.Item
              name="effective_date"
              label="Effective date"
              extra="Must be after today in Jakarta time."
              rules={[
                { required: true, message: 'Choose an effective date.' },
                {
                  validator: (_, value) =>
                    !value || isFutureWibDate(value)
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error(
                            'Choose a date after today in Jakarta time.',
                          ),
                        ),
                },
              ]}
            >
              <Input
                type="date"
                min={tomorrowWib()}
                aria-label="Effective date"
              />
            </Form.Item>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0 12px',
              }}
            >
              {rateKeys.map(key => (
                <Form.Item
                  key={key}
                  name={key}
                  label={`${key} rate`}
                  validateTrigger={['onBlur', 'onSubmit']}
                  rules={[
                    { required: true, message: `Enter the ${key} rate.` },
                    {
                      validator: (_, value) =>
                        !value || parseRate(value) !== null
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error('Use a number above 0.'),
                            ),
                    },
                  ]}
                >
                  <Input
                    inputMode="decimal"
                    placeholder="e.g. 6"
                    autoComplete="off"
                  />
                </Form.Item>
              ))}
            </div>
          </Form>
        </Modal>
      </section>
    </ConfigProvider>
  );
}
