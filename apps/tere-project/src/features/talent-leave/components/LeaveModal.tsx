'use client';
import { Modal, Form, Select, DatePicker, Button, Input, App, Space, Card } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useTalentLeaveStore } from '../store/talentLeaveStore';
import { useTalentList } from '../hooks/useTalentList';
import { useLeaveCreate } from '../hooks/useLeaveCreate';
import { useLeaveUpdate } from '../hooks/useLeaveUpdate';
import { useLeaveDelete } from '../hooks/useLeaveDelete';
import { disablePastDates, disableBeforeDate } from '../utils/dateUtils';
import { CreateLeaveRequest, LeaveDateRange } from '../types/talent-leave.types';

interface LeaveModalProps {
  leaveRecord?: {
    id: string;
    name: string;
    team: string;
    role: string;
    leaveDate: LeaveDateRange[];
  };
  isAdmin?: boolean;
}

export function LeaveModal({ leaveRecord, isAdmin = false }: LeaveModalProps) {
  const [form] = Form.useForm();
  const [selectedTalentId, setSelectedTalentId] = useState<string>('');
  const { modal } = App.useApp();

  const { modalState, closeModal } = useTalentLeaveStore();
  const { data: talentList, isLoading: isTalentListLoading } = useTalentList();

  const createMutation = useLeaveCreate();
  const updateMutation = useLeaveUpdate();
  const deleteMutation = useLeaveDelete();

  const isEditMode = modalState.mode === 'edit';

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && leaveRecord) {
      // Map all leave dates for editing
      const leaveDates = leaveRecord.leaveDate.map((range) => ({
        dateFrom: dayjs(range.dateFrom),
        dateTo: dayjs(range.dateTo),
        status: range.status,
      }));

      form.setFieldsValue({
        name: leaveRecord.name,
        team: leaveRecord.team,
        role: leaveRecord.role,
        leaveDates: leaveDates.length > 0 ? leaveDates : [{}],
      });

      // Find talent by name to set selectedTalentId
      const talent = talentList?.find((t) => t.name === leaveRecord.name);
      if (talent) {
        setSelectedTalentId(talent.id);
      }
    } else {
      form.resetFields();
      form.setFieldsValue({
        leaveDates: [{}], // Start with one empty leave date
      });
      setSelectedTalentId('');
    }
  }, [isEditMode, leaveRecord, form, talentList]);

  const handleNameChange = (talentId: string) => {
    setSelectedTalentId(talentId);
    const selectedTalent = talentList?.find((t) => t.id === talentId);
    if (selectedTalent) {
      form.setFieldsValue({
        name: selectedTalent.name,
        team: selectedTalent.team,
        role: selectedTalent.role,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Filter out empty leave dates and format them
      const leaveDates: LeaveDateRange[] = (values.leaveDates || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((ld: any) => ld && ld.dateFrom && ld.dateTo && ld.status)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((ld: any) => ({
          dateFrom: ld.dateFrom.format('YYYY-MM-DD'),
          dateTo: ld.dateTo.format('YYYY-MM-DD'),
          status: ld.status,
        }));

      const formData: CreateLeaveRequest = {
        name: values.name,
        team: values.team,
        role: values.role,
        // In edit mode, send empty array to remove all leave dates
        // In create mode, send undefined if no dates provided
        leaveDate: isEditMode
          ? leaveDates // Send array (could be empty to remove all)
          : leaveDates.length > 0
            ? leaveDates
            : undefined,
      };

      if (isEditMode && leaveRecord) {
        await updateMutation.mutateAsync({
          id: leaveRecord.id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }

      closeModal();
      form.resetFields();
      setSelectedTalentId('');
    } catch (error) {
      // Form validation errors are handled by Ant Design Form
      console.error('Form validation or submission error:', error);
    }
  };

  const handleDelete = () => {
    if (!leaveRecord) {
      return;
    }

    modal.confirm({
      title: 'Delete Leave Record',
      content: 'Are you sure you want to delete this leave record?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(leaveRecord.id);
          closeModal();
          form.resetFields();
          setSelectedTalentId('');
        } catch (error) {
          // Error message handled by mutation hook
          console.error('Delete error:', error);
        }
      },
    });
  };

  const handleCancel = () => {
    closeModal();
    form.resetFields();
    setSelectedTalentId('');
  };

  return (
    <Modal
      title={isEditMode ? 'Edit Leave Record' : 'Add Leave Record'}
      open={modalState.open}
      onCancel={handleCancel}
      width={700}
      footer={[
        ...(isEditMode && isAdmin
          ? [
              <Button
                key="delete"
                danger
                onClick={handleDelete}
                loading={deleteMutation.isPending}
                disabled={!leaveRecord}
              >
                Delete
              </Button>,
            ]
          : []),
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={createMutation.isPending || updateMutation.isPending}
        >
          {isEditMode ? 'Update' : 'Create'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: 'Please select a name' }]}
        >
          <Select
            showSearch
            placeholder="Select team member"
            optionFilterProp="label"
            loading={isTalentListLoading}
            onChange={handleNameChange}
            value={selectedTalentId}
            options={talentList?.map((talent) => ({
              value: talent.id,
              label: talent.name,
            }))}
          />
        </Form.Item>

        <Form.Item label="Team" name="team">
          <Input disabled placeholder="Auto-populated from name" />
        </Form.Item>

        <Form.Item label="Role" name="role">
          <Input disabled placeholder="Auto-populated from name" />
        </Form.Item>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Leave Dates (Optional)</h3>
          <Form.List name="leaveDates" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 16 }}
                    title={`Leave Date ${name + 1}`}
                    extra={
                      // In edit mode, always show delete. In create mode, only show if > 1
                      (isEditMode || fields.length > 1) && (
                        <MinusCircleOutlined
                          onClick={() => remove(name)}
                          style={{ color: 'red', cursor: 'pointer' }}
                          title="Delete this leave date range"
                        />
                      )
                    }
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Form.Item
                        {...restField}
                        name={[name, 'dateFrom']}
                        label="Date From"
                        rules={[
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const leaveDates = getFieldValue('leaveDates');
                              const hasAnyDate = leaveDates?.some(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (ld: any) => ld && (ld.dateFrom || ld.dateTo || ld.status)
                              );
                              if (hasAnyDate && !value) {
                                return Promise.reject(new Error('Please select start date'));
                              }
                              return Promise.resolve();
                            },
                          }),
                        ]}
                      >
                        <DatePicker
                          format="YYYY-MM-DD"
                          disabledDate={disablePastDates}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'dateTo']}
                        label="Date To"
                        dependencies={[['leaveDates', name, 'dateFrom']]}
                        rules={[
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const leaveDates = getFieldValue('leaveDates');
                              const hasAnyDate = leaveDates?.some(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (ld: any) => ld && (ld.dateFrom || ld.dateTo || ld.status)
                              );
                              if (hasAnyDate && !value) {
                                return Promise.reject(new Error('Please select end date'));
                              }
                              const dateFrom = getFieldValue(['leaveDates', name, 'dateFrom']);
                              if (value && dateFrom && value.isBefore(dateFrom, 'day')) {
                                return Promise.reject(
                                  new Error('End date must be on or after start date')
                                );
                              }
                              return Promise.resolve();
                            },
                          }),
                        ]}
                      >
                        <DatePicker
                          format="YYYY-MM-DD"
                          disabledDate={(current) => {
                            const dateFrom = form.getFieldValue(['leaveDates', name, 'dateFrom']);
                            return disableBeforeDate(current, dateFrom);
                          }}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'status']}
                        label="Status"
                        rules={[
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const leaveDates = getFieldValue('leaveDates');
                              const hasAnyDate = leaveDates?.some(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (ld: any) => ld && (ld.dateFrom || ld.dateTo || ld.status)
                              );
                              if (hasAnyDate && !value) {
                                return Promise.reject(new Error('Please select status'));
                              }
                              return Promise.resolve();
                            },
                          }),
                        ]}
                      >
                        <Select
                          placeholder="Select status"
                          options={[
                            { value: 'Draft', label: 'Draft' },
                            { value: 'Confirmed', label: 'Confirmed' },
                          ]}
                        />
                      </Form.Item>
                    </Space>
                  </Card>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add Leave Date Range
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </div>
      </Form>
    </Modal>
  );
}
