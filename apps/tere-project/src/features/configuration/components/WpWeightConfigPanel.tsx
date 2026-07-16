'use client';

import { useState } from 'react';
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
import {
  WEIGHT_KEYS,
  errorMessage,
  useCreateWpWeightConfig,
  useDeleteWpWeightConfig,
  useWpWeightConfigs,
  type WPWeightConfig,
  type WPWeights,
  type WeightKey,
} from './WpWeightConfigPanel.api';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";
const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";

type FormValues = { effective_date: string } & Record<WeightKey, string>;

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

function parseWeight(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const weight = Number(normalized);
  return Number.isFinite(weight) && weight > 0 && weight <= 100 ? weight : null;
}

function isFutureWibDate(value: string, now = new Date()): boolean {
  return value > todayWib(now);
}

export default function WpWeightConfigPanel() {
  const [form] = Form.useForm<FormValues>();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useWpWeightConfigs();
  const createConfig = useCreateWpWeightConfig();
  const deleteConfig = useDeleteWpWeightConfig();
  const colors = useThemeColors();

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

    const weights = Object.fromEntries(
      WEIGHT_KEYS.map(key => [key, parseWeight(values[key])]),
    ) as WPWeights;

    try {
      await createConfig.mutateAsync({
        effective_date: values.effective_date,
        weights,
      });
      message.success('Weight configuration created.');
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
      message.success('Weight configuration deleted.');
    } catch (mutationError) {
      message.error(errorMessage(mutationError, 'delete'));
    }
  };

  const columns: TableColumnsType<WPWeightConfig> = [
    {
      title: 'Effective date',
      dataIndex: 'effective_date',
      width: 150,
      render: (value: string) => (
        <span style={{ fontFamily: mono }}>{value}</span>
      ),
    },
    ...WEIGHT_KEYS.map(key => ({
      title: key,
      width: 115,
      render: (_: unknown, record: WPWeightConfig) => (
        <span style={{ fontFamily: mono }}>{record.weights[key]}</span>
      ),
    })),
    {
      title: 'Action',
      key: 'action',
      width: 130,
      fixed: 'right' as const,
      render: (_: unknown, record: WPWeightConfig) =>
        isFutureWibDate(record.effective_date) ? (
          <Popconfirm
            title="Delete future configuration?"
            description="This scheduled weight configuration will be permanently removed."
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
        ) : (
          <Typography.Text type="secondary">Immutable</Typography.Text>
        ),
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
        aria-labelledby="wp-weight-config-title"
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
              id="wp-weight-config-title"
              style={{
                margin: 0,
                color: colors.titleCol,
                font: `700 18px ${sans}`,
              }}
            >
              WP Weight Configuration
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                color: colors.subCol,
                font: `12px ${sans}`,
              }}
            >
              Schedule the weight assigned to each complexity level.
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined aria-hidden />}
            onClick={() => setCreateOpen(true)}
          >
            Add configuration
          </Button>
        </div>

        {isError ? (
          <Alert
            type="error"
            showIcon
            message="Could not load weight configurations"
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
          <Table<WPWeightConfig>
            rowKey="id"
            columns={columns}
            dataSource={data}
            loading={{ spinning: isLoading, tip: 'Loading configurations...' }}
            pagination={false}
            scroll={{ x: 760 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No weight configurations yet. Add one with a future effective date."
                />
              ),
            }}
          />
        )}

        <Modal
          title="Add weight configuration"
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
              {WEIGHT_KEYS.map(key => (
                <Form.Item
                  key={key}
                  name={key}
                  label={`${key} weight`}
                  validateTrigger={['onBlur', 'onSubmit']}
                  rules={[
                    { required: true, message: `Enter the ${key} weight.` },
                    {
                      validator: (_, value) =>
                        !value || parseWeight(value) !== null
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error('Use a number above 0 and up to 100.'),
                            ),
                    },
                  ]}
                >
                  <Input
                    inputMode="decimal"
                    placeholder="e.g. 1,5"
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
