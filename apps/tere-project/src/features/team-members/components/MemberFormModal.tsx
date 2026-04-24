import React, { useEffect } from 'react';
import { Modal, Input, Button, Form, Select, Switch, message } from 'antd';
import { useCreateMember, useUpdateMember } from '../hooks/useMembers';
import type { MemberResponse } from '@shared/types/member.types';
import type { BoardResponse } from '@shared/types/board.types';
import { Level } from '@shared/types/common.types';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberResponse | null;
  boards: BoardResponse[];
}

const LEVEL_OPTIONS = [
  { label: 'Junior', value: Level.Junior },
  { label: 'Medior', value: Level.Medior },
  { label: 'Senior', value: Level.Senior },
  { label: 'Individual Contributor', value: Level.IC },
];

export default function MemberFormModal({
  isOpen,
  onClose,
  member,
  boards,
}: MemberFormModalProps) {
  const [form] = Form.useForm();
  const { mutateAsync: createMember, isPending: isCreating } =
    useCreateMember();
  const { mutateAsync: updateMember, isPending: isUpdating } =
    useUpdateMember();

  const isEditMode = member !== null;
  const isSubmitting = isCreating || isUpdating;

  const teamOptions = boards
    .filter(board => !board.isBugMonitoring)
    .map(board => ({
      label: board.shortName,
      value: board.shortName,
    }));

  useEffect(() => {
    if (isOpen && member) {
      form.setFieldsValue({
        name: member.name,
        fullName: member.fullName,
        email: member.email,
        level: member.level,
        isLead: member.isLead,
        teams: member.teams,
      });
    } else if (!isOpen) {
      form.resetFields();
    }
  }, [isOpen, member, form]);

  const handleSubmit = async (values: {
    jiraId?: string;
    name: string;
    fullName: string;
    email: string;
    level: Level;
    isLead: boolean;
    teams: string[];
  }) => {
    try {
      const { jiraId, ...rest } = values;
      const payload = {
        ...rest,
        isLead: rest.isLead ?? false,
      };

      if (isEditMode) {
        await updateMember({ id: member.id, ...payload });
        message.success('Member updated successfully');
      } else {
        await createMember({ ...(jiraId ? { id: jiraId } : {}), ...payload });
        message.success('Member created successfully');
      }

      onClose();
    } catch {
      message.error(
        isEditMode ? 'Failed to update member' : 'Failed to create member',
      );
    }
  };

  return (
    <Modal
      title={
        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-cyan-500">
          {isEditMode ? 'Edit Member' : 'Add New Member'}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ isLead: false }}
        className="mt-4"
      >
        {!isEditMode && (
          <Form.Item
            name="jiraId"
            label={<span className="font-medium text-gray-700">Jira ID</span>}
            rules={[
              { required: true, message: 'Please enter the Jira Account ID' },
            ]}
            tooltip="Ask author if you don't know how to get the ID"
          >
            <Input
              placeholder="e.g. 5f2b3c4d5e6f7a8b9c0d1e2f"
              size="large"
              className="rounded-xl border-gray-200 hover:border-purple-400 focus:border-purple-500"
            />
          </Form.Item>
        )}

        <Form.Item
          name="name"
          label={<span className="font-medium text-gray-700">Name</span>}
          rules={[{ required: true, message: 'Please enter the member name' }]}
        >
          <Input
            placeholder="e.g. John"
            size="large"
            className="rounded-xl border-gray-200 hover:border-purple-400 focus:border-purple-500"
          />
        </Form.Item>

        <Form.Item
          name="fullName"
          label={<span className="font-medium text-gray-700">Full Name</span>}
          rules={[{ required: true, message: 'Please enter the full name' }]}
        >
          <Input
            placeholder="e.g. John Doe"
            size="large"
            className="rounded-xl border-gray-200 hover:border-purple-400 focus:border-purple-500"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label={<span className="font-medium text-gray-700">Email</span>}
          rules={[
            { required: true, message: 'Please enter the email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            placeholder="e.g. john.doe@company.com"
            size="large"
            className="rounded-xl border-gray-200 hover:border-purple-400 focus:border-purple-500"
          />
        </Form.Item>

        <Form.Item
          name="level"
          label={<span className="font-medium text-gray-700">Level</span>}
          rules={[{ required: true, message: 'Please select a level' }]}
        >
          <Select
            placeholder="Select level"
            size="large"
            options={LEVEL_OPTIONS}
            className="rounded-xl"
          />
        </Form.Item>

        <Form.Item
          name="isLead"
          label={<span className="font-medium text-gray-700">Is Lead</span>}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prev, cur) => prev.isLead !== cur.isLead}
        >
          {({ getFieldValue }) =>
            getFieldValue('isLead') ? (
              <div className="mb-4 rounded-xl bg-purple-50 border border-purple-100 px-4 py-3 text-sm text-purple-700">
                This member has lead access to view all teams and bug
                monitoring.
              </div>
            ) : null
          }
        </Form.Item>

        <Form.Item
          name="teams"
          label={<span className="font-medium text-gray-700">Teams</span>}
          rules={[
            { required: true, message: 'Please select at least one team' },
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Select teams"
            size="large"
            options={teamOptions}
            className="rounded-xl"
          />
        </Form.Item>

        <Form.Item className="mt-8 mb-0 flex justify-end">
          <Button onClick={onClose} className="mr-3 rounded-lg border-gray-200">
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 border-none px-6"
          >
            {isEditMode ? 'Update Member' : 'Save Member'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
