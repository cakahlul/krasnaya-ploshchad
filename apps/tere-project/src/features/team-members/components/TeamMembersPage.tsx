'use client';

import { useState } from 'react';
import { Table, Button, Tag, Popconfirm, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Pencil, Trash2, UserPlus } from 'lucide-react';

import { useMembers, useDeleteMember } from '../hooks/useMembers';
import { useBoards } from '@src/features/dashboard/hooks/useBoards';
import { useThemeColors } from '@src/hooks/useTheme';
import MemberFormModal from './MemberFormModal';
import type { MemberResponse } from '@shared/types/member.types';
import { Level } from '@shared/types/common.types';

const LEVEL_COLOR_MAP: Record<Level, string> = {
  [Level.Junior]: 'blue',
  [Level.Medior]: 'green',
  [Level.Senior]: 'orange',
  [Level.IC]: 'purple',
};

export default function TeamMembersPage() {
  const { members, isLoading } = useMembers();
  const { boards } = useBoards();
  const deleteMember = useDeleteMember();
  const { accent, accentL, cardBg, cardBrd, titleCol, subCol, rowCol } =
    useThemeColors();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberResponse | null>(
    null,
  );

  const handleAdd = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleEdit = (member: MemberResponse) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMember.mutateAsync(id);
      message.success('Member deleted successfully');
    } catch {
      message.error('Failed to delete member');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const columns: ColumnsType<MemberResponse> = [
    {
      title: 'Name',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, color: rowCol }}>
            {record.fullName}
          </div>
          <div style={{ fontSize: 13, color: subCol }}>{record.name}</div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      render: (level: Level) => (
        <Tag color={LEVEL_COLOR_MAP[level]}>{level}</Tag>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'isLead',
      key: 'isLead',
      render: (isLead: boolean) =>
        isLead ? (
          <Tag color="green">Lead</Tag>
        ) : (
          <Tag color="default">Member</Tag>
        ),
    },
    {
      title: 'Teams',
      dataIndex: 'teams',
      key: 'teams',
      render: (teams: string[]) => (
        <div className="flex flex-wrap gap-1">
          {teams.map(team => (
            <Tag key={team} color="cyan">
              {team}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button
            type="text"
            size="small"
            icon={<Pencil size={16} />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete member"
            description="Are you sure you want to delete this member?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 size={16} />}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="relative p-6 tere-table tere-modal">
      <div
        style={{ marginBottom: 18 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: titleCol,
              margin: 0,
              fontFamily: "'Space Grotesk',sans-serif",
              letterSpacing: -0.3,
            }}
          >
            Team Members
          </h2>
          <p
            style={{
              color: subCol,
              margin: '4px 0 0',
              fontSize: 12.5,
              fontFamily: "'Space Grotesk',sans-serif",
            }}
          >
            Manage your team members and their roles
          </p>
        </div>
        <Button
          type="primary"
          icon={<UserPlus size={16} />}
          onClick={handleAdd}
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accentL})`,
            border: 'none',
            borderRadius: 8,
          }}
          size="large"
        >
          Add Member
        </Button>
      </div>

      <div
        style={{
          background: cardBg,
          borderRadius: 14,
          border: `1px solid ${cardBrd}`,
          overflow: 'hidden',
        }}
      >
        <Table
          columns={columns}
          dataSource={members}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 800 }}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <MemberFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        member={editingMember}
        boards={boards}
      />
    </div>
  );
}
