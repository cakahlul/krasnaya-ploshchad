'use client';

import { useState } from 'react';
import { Table, Button, Tag, Popconfirm, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Pencil, Trash2, UserPlus } from 'lucide-react';

import { useMembers, useDeleteMember } from '../hooks/useMembers';
import { useBoards } from '@src/features/dashboard/hooks/useBoards';
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
          <div className="font-medium text-gray-800">{record.fullName}</div>
          <div className="text-sm text-gray-400">{record.name}</div>
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Team Members</h1>
          <p className="text-gray-500 mt-1">
            Manage your team members and their roles
          </p>
        </div>
        <Button
          type="primary"
          icon={<UserPlus size={16} />}
          onClick={handleAdd}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
          }}
          size="large"
        >
          Add Member
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
