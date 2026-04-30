'use client';

import { useState } from 'react';
import { Table, Button, Tag, Popconfirm, message, Input, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus, Trash2, Copy, Eye, EyeOff, ExternalLink } from 'lucide-react';

import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
} from '../hooks/useApiKeys';
import { useThemeColors } from '@src/hooks/useTheme';
import type { ApiKeyResponse } from '@shared/types/api-key.types';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";
const mono = "'IBM Plex Mono', monospace";

export default function McpConnectionPage() {
  const { apiKeys, isLoading } = useApiKeys();
  const createApiKey = useCreateApiKey();
  const revokeApiKey = useRevokeApiKey();
  const {
    accent,
    accentL,
    cardBg,
    cardBrd,
    titleCol,
    subCol,
    rowCol,
    isDark,
    pageBg,
  } = useThemeColors();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      message.warning('Please enter a name for the API key');
      return;
    }
    try {
      const result = await createApiKey.mutateAsync(newKeyName.trim());
      setCreatedKey(result.rawKey);
      setNewKeyName('');
      setShowKey(true);
      message.success('API key created');
    } catch {
      message.error('Failed to create API key');
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeApiKey.mutateAsync(id);
      message.success('API key revoked');
    } catch {
      message.error('Failed to revoke API key');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

  const handleCloseCreated = () => {
    setCreatedKey(null);
    setIsCreateOpen(false);
    setShowKey(false);
  };

  const appUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://tere-project.vercel.app';

  const mcpConfig = (apiKey?: string) =>
    JSON.stringify(
      {
        mcpServers: {
          'tere-reports': {
            command: 'npx',
            args: ['-y', '@esjn/mcp-tere-report'],
            env: {
              TERE_API_URL: appUrl,
              TERE_API_KEY: apiKey ?? 'tere_your_api_key_here',
            },
          },
        },
      },
      null,
      2,
    );

  const codeBg = isDark ? '#0d1117' : '#f6f8fa';
  const codeBrd = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const warnBg = isDark ? '#1a1a2e' : '#fff7ed';
  const warnBrd = isDark ? '#ff6b3540' : '#fed7aa';
  const warnCol = isDark ? '#fbbf24' : '#c2410c';
  const stepNumBg = `linear-gradient(135deg, ${accent}, ${accentL})`;

  /* ---- Table columns ---- */
  const columns: ColumnsType<ApiKeyResponse> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span style={{ fontWeight: 500, color: rowCol }}>{name}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) =>
        isActive ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Revoked</Tag>
        ),
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (email: string) => (
        <span style={{ fontSize: 13, color: subCol }}>{email}</span>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <span style={{ fontSize: 13, color: subCol }}>
          {new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      title: 'Last Used',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      render: (date: string | null) => (
        <span style={{ fontSize: 13, color: subCol }}>
          {date
            ? new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : 'Never'}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) =>
        record.isActive ? (
          <Popconfirm
            title="Revoke API key"
            description="This key will no longer work. This cannot be undone."
            onConfirm={() => handleRevoke(record.id)}
            okText="Revoke"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 size={16} />}
            />
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: titleCol,
            margin: 0,
            fontFamily: sans,
            letterSpacing: -0.3,
          }}
        >
          MCP Connection
        </h2>
        <p
          style={{
            color: subCol,
            margin: '4px 0 0',
            fontSize: 12.5,
            fontFamily: sans,
          }}
        >
          Connect Claude Code to Tere via Model Context Protocol for AI-powered
          team reports
        </p>
      </div>

      {/* Tutorial Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {/* Step 1 */}
        <div
          style={{
            background: cardBg,
            borderRadius: 14,
            border: `1px solid ${cardBrd}`,
            padding: '20px 24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: stepNumBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              1
            </div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: titleCol,
                margin: 0,
                fontFamily: sans,
              }}
            >
              Generate an API Key
            </h3>
          </div>
          <p
            style={{
              fontSize: 13,
              color: subCol,
              margin: '0 0 14px',
              paddingLeft: 40,
              lineHeight: 1.6,
            }}
          >
            Create an API key below. This key authenticates the MCP server when
            accessing your team&apos;s report data. Keep it safe — you&apos;ll
            only see it once.
          </p>
          <div style={{ paddingLeft: 40 }}>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setIsCreateOpen(true)}
              style={{ background: stepNumBg, border: 'none', borderRadius: 8 }}
            >
              Create API Key
            </Button>
          </div>
        </div>

        {/* Step 2 */}
        <div
          style={{
            background: cardBg,
            borderRadius: 14,
            border: `1px solid ${cardBrd}`,
            padding: '20px 24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: stepNumBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              2
            </div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: titleCol,
                margin: 0,
                fontFamily: sans,
              }}
            >
              Add MCP Server to Claude Code
            </h3>
          </div>
          <p
            style={{
              fontSize: 13,
              color: subCol,
              margin: '0 0 14px',
              paddingLeft: 40,
              lineHeight: 1.6,
            }}
          >
            Choose one of these methods. Replace{' '}
            <code
              style={{
                fontFamily: mono,
                background: codeBg,
                padding: '1px 5px',
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              tere_your_api_key_here
            </code>{' '}
            with your actual key.
          </p>

          {/* Method A: CLI command */}
          <div style={{ paddingLeft: 40, marginBottom: 14 }}>
            <p
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: rowCol,
                margin: '0 0 8px',
                fontFamily: sans,
              }}
            >
              Option A: Run this command in your terminal
            </p>
            <div
              style={{
                position: 'relative',
                background: codeBg,
                borderRadius: 10,
                border: `1px solid ${codeBrd}`,
                padding: '14px 16px',
                paddingRight: 50,
              }}
            >
              <pre
                style={{
                  fontSize: 12,
                  color: rowCol,
                  margin: 0,
                  fontFamily: mono,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  overflowX: 'auto',
                }}
              >
                {`claude mcp add-json tere-reports '${JSON.stringify({ type: 'stdio', command: 'npx', args: ['-y', '@esjn/mcp-tere-report'], env: { TERE_API_URL: appUrl, TERE_API_KEY: 'tere_your_api_key_here' } })}'`}
              </pre>
              <Button
                type="text"
                size="small"
                icon={<Copy size={14} />}
                onClick={() =>
                  handleCopy(
                    `claude mcp add-json tere-reports '${JSON.stringify({ type: 'stdio', command: 'npx', args: ['-y', '@esjn/mcp-tere-report'], env: { TERE_API_URL: appUrl, TERE_API_KEY: 'tere_your_api_key_here' } })}'`,
                  )
                }
                style={{ position: 'absolute', top: 10, right: 10 }}
              />
            </div>
            <p style={{ fontSize: 11.5, color: subCol, margin: '6px 0 0' }}>
              Add{' '}
              <code
                style={{
                  fontFamily: mono,
                  background: codeBg,
                  padding: '1px 4px',
                  borderRadius: 3,
                  fontSize: 11,
                }}
              >
                --scope user
              </code>{' '}
              to make it available globally, or{' '}
              <code
                style={{
                  fontFamily: mono,
                  background: codeBg,
                  padding: '1px 4px',
                  borderRadius: 3,
                  fontSize: 11,
                }}
              >
                --scope project
              </code>{' '}
              for current project only.
            </p>
          </div>

          {/* Method B: .mcp.json */}
          <div style={{ paddingLeft: 40 }}>
            <p
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: rowCol,
                margin: '0 0 8px',
                fontFamily: sans,
              }}
            >
              Option B: Add to{' '}
              <code
                style={{
                  fontFamily: mono,
                  background: codeBg,
                  padding: '1px 5px',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                .mcp.json
              </code>{' '}
              in your project root
            </p>
            <div
              style={{
                position: 'relative',
                background: codeBg,
                borderRadius: 10,
                border: `1px solid ${codeBrd}`,
                padding: '14px 16px',
                paddingRight: 50,
              }}
            >
              <pre
                style={{
                  fontSize: 12,
                  color: rowCol,
                  margin: 0,
                  fontFamily: mono,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  overflowX: 'auto',
                }}
              >
                {mcpConfig()}
              </pre>
              <Button
                type="text"
                size="small"
                icon={<Copy size={14} />}
                onClick={() => handleCopy(mcpConfig())}
                style={{ position: 'absolute', top: 10, right: 10 }}
              />
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div
          style={{
            background: cardBg,
            borderRadius: 14,
            border: `1px solid ${cardBrd}`,
            padding: '20px 24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: stepNumBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              3
            </div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: titleCol,
                margin: 0,
                fontFamily: sans,
              }}
            >
              Start Using
            </h3>
          </div>
          <p
            style={{
              fontSize: 13,
              color: subCol,
              margin: '0 0 14px',
              paddingLeft: 40,
              lineHeight: 1.6,
            }}
          >
            Once configured, ask Claude things like:
          </p>
          <div
            style={{
              paddingLeft: 40,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {[
              '"Show me the sprint report for project PROJ sprint 123"',
              '"What\'s the current open sprint status for project PROJ?"',
              '"Get the productivity summary for March 2025"',
              '"List the epics for project PROJ this sprint"',
            ].map((prompt, i) => (
              <div
                key={i}
                style={{
                  background: codeBg,
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12.5,
                  color: accent,
                  fontFamily: mono,
                  border: `1px solid ${codeBrd}`,
                }}
              >
                {prompt}
              </div>
            ))}
          </div>
        </div>

        {/* Available Tools */}
        <div
          style={{
            background: cardBg,
            borderRadius: 14,
            border: `1px solid ${cardBrd}`,
            padding: '20px 24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 14,
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: titleCol,
                margin: 0,
                fontFamily: sans,
              }}
            >
              Available MCP Tools
            </h3>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 10,
            }}
          >
            {[
              {
                name: 'get-sprint-report',
                desc: 'Sprint or date range team reports',
              },
              {
                name: 'get-open-sprint-report',
                desc: 'Current active sprint report',
              },
              { name: 'get-epics', desc: 'List epics for a project' },
              {
                name: 'get-productivity-summary',
                desc: 'Monthly productivity metrics',
              },
            ].map(tool => (
              <div
                key={tool.name}
                style={{
                  background: pageBg,
                  borderRadius: 10,
                  padding: '12px 14px',
                  border: `1px solid ${codeBrd}`,
                }}
              >
                <code
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: accent,
                    fontFamily: mono,
                  }}
                >
                  {tool.name}
                </code>
                <p
                  style={{
                    fontSize: 11.5,
                    color: subCol,
                    margin: '4px 0 0',
                    lineHeight: 1.4,
                  }}
                >
                  {tool.desc}
                </p>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: `1px solid ${codeBrd}`,
            }}
          >
            <a
              href="https://www.npmjs.com/package/@esjn/mcp-tere-report"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12.5,
                color: accent,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              View on npm <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* API Keys Table */}
      <div
        style={{ marginBottom: 18 }}
        className="flex justify-between items-center"
      >
        <div>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: titleCol,
              margin: 0,
              fontFamily: sans,
            }}
          >
            API Keys
          </h3>
          <p
            style={{
              color: subCol,
              margin: '2px 0 0',
              fontSize: 12,
              fontFamily: sans,
            }}
          >
            Manage your generated API keys
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsCreateOpen(true)}
          style={{ background: stepNumBg, border: 'none', borderRadius: 8 }}
        >
          Create Key
        </Button>
      </div>

      <div
        className="tere-table"
        style={{
          background: cardBg,
          borderRadius: 14,
          border: `1px solid ${cardBrd}`,
          overflow: 'hidden',
        }}
      >
        <Table
          columns={columns}
          dataSource={apiKeys}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 700 }}
          pagination={{ pageSize: 10 }}
        />
      </div>

      {/* Create Modal */}
      <Modal
        title="Create API Key"
        open={isCreateOpen && !createdKey}
        onCancel={() => {
          setIsCreateOpen(false);
          setNewKeyName('');
        }}
        onOk={handleCreate}
        confirmLoading={createApiKey.isPending}
        okText="Create"
        okButtonProps={{ style: { background: stepNumBg, border: 'none' } }}
      >
        <div style={{ marginTop: 16 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: rowCol,
              marginBottom: 6,
              fontFamily: sans,
            }}
          >
            Key Name
          </label>
          <Input
            placeholder="e.g., claude-code-mac-mini"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            onPressEnter={handleCreate}
            size="large"
          />
          <p style={{ fontSize: 12, color: subCol, marginTop: 8 }}>
            Give it a descriptive name so you can identify it later.
          </p>
        </div>
      </Modal>

      {/* Created Key Modal */}
      <Modal
        title="API Key Created"
        open={!!createdKey}
        onCancel={handleCloseCreated}
        footer={[
          <Button
            key="done"
            type="primary"
            onClick={handleCloseCreated}
            style={{ background: stepNumBg, border: 'none' }}
          >
            Done
          </Button>,
        ]}
        closable={false}
      >
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              background: warnBg,
              border: `1px solid ${warnBrd}`,
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontSize: 12.5,
                color: warnCol,
                margin: 0,
                fontWeight: 600,
              }}
            >
              Copy this key now. You won&apos;t be able to see it again!
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: codeBg,
              borderRadius: 8,
              padding: '10px 12px',
              border: `1px solid ${codeBrd}`,
            }}
          >
            <code
              style={{
                flex: 1,
                fontSize: 13,
                wordBreak: 'break-all',
                color: rowCol,
                fontFamily: mono,
              }}
            >
              {showKey ? createdKey : '\u2022'.repeat(40)}
            </code>
            <Button
              type="text"
              size="small"
              icon={showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              onClick={() => setShowKey(!showKey)}
            />
            <Button
              type="text"
              size="small"
              icon={<Copy size={16} />}
              onClick={() => handleCopy(createdKey!)}
            />
          </div>

          <div
            style={{
              marginTop: 16,
              background: codeBg,
              borderRadius: 8,
              padding: '12px 14px',
              border: `1px solid ${codeBrd}`,
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: subCol,
                margin: '0 0 8px',
                fontWeight: 600,
              }}
            >
              Run this in your terminal:
            </p>
            <pre
              style={{
                fontSize: 11.5,
                color: rowCol,
                margin: 0,
                fontFamily: mono,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
              }}
            >
              {`claude mcp add-json tere-reports '${JSON.stringify({ type: 'stdio', command: 'npx', args: ['-y', '@esjn/mcp-tere-report'], env: { TERE_API_URL: appUrl, TERE_API_KEY: showKey && createdKey ? createdKey : 'tere_your_api_key_here' } })}'`}
            </pre>
            <Button
              type="text"
              size="small"
              icon={<Copy size={14} />}
              onClick={() =>
                handleCopy(
                  `claude mcp add-json tere-reports '${JSON.stringify({ type: 'stdio', command: 'npx', args: ['-y', '@esjn/mcp-tere-report'], env: { TERE_API_URL: appUrl, TERE_API_KEY: createdKey ?? '' } })}'`,
                )
              }
              style={{ marginTop: 8, fontSize: 12 }}
            >
              Copy command
            </Button>
          </div>

          <div
            style={{
              marginTop: 12,
              background: codeBg,
              borderRadius: 8,
              padding: '12px 14px',
              border: `1px solid ${codeBrd}`,
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: subCol,
                margin: '0 0 8px',
                fontWeight: 600,
              }}
            >
              Or add to <code style={{ fontFamily: mono }}>.mcp.json</code> in
              your project root:
            </p>
            <pre
              style={{
                fontSize: 11.5,
                color: rowCol,
                margin: 0,
                fontFamily: mono,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
              }}
            >
              {mcpConfig(showKey && createdKey ? createdKey : undefined)}
            </pre>
            <Button
              type="text"
              size="small"
              icon={<Copy size={14} />}
              onClick={() => handleCopy(mcpConfig(createdKey ?? undefined))}
              style={{ marginTop: 8, fontSize: 12 }}
            >
              Copy config
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
