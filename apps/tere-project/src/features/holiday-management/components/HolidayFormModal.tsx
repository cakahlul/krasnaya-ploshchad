import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Form, message, Popconfirm } from 'antd';
import { useCreateHoliday, useDeleteHoliday } from '../hooks/useHolidayQueries';
import dayjs from 'dayjs';

interface HolidayFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRange: { start: string; end: string } | null;
  existingHolidays: any[];
}

export default function HolidayFormModal({ isOpen, onClose, selectedRange, existingHolidays }: HolidayFormModalProps) {
  const [form] = Form.useForm();
  const { mutateAsync: createHoliday, isPending: isCreating } = useCreateHoliday();
  const { mutateAsync: deleteHoliday, isPending: isDeleting } = useDeleteHoliday();

  const handleDelete = async (id: string) => {
    try {
      await deleteHoliday(id);
      message.success('Holiday deleted');
      onClose(); // Close modal immediately on delete so they don't see the Add New form
    } catch (error) {
      message.error('Failed to delete holiday');
    }
  };

  useEffect(() => {
    if (isOpen && selectedRange) {
      if (selectedRange.start === selectedRange.end) {
        form.setFieldsValue({ name: '' });
      } else {
        form.setFieldsValue({ name: '' });
      }
    } else {
      form.resetFields();
    }
  }, [isOpen, selectedRange, form]);

  const handleSubmit = async (values: { name: string }) => {
    if (!selectedRange) return;

    try {
      const start = dayjs(selectedRange.start);
      const end = dayjs(selectedRange.end);
      let current = start;
      const tasks: Promise<any>[] = [];

      while (current.isBefore(end) || current.isSame(end, 'day')) {
        tasks.push(
          createHoliday({
            date: current.format('YYYY-MM-DD'),
            name: values.name,
          })
        );
        current = current.add(1, 'day');
      }

      await Promise.all(tasks);
      message.success('Holiday(s) created successfully!');
      onClose();
    } catch (error) {
      console.error(error);
      message.error('Failed to create holiday(s)');
    }
  };

  const isRange = selectedRange && selectedRange.start !== selectedRange.end;
  const dateText = isRange
    ? `${dayjs(selectedRange?.start).format('DD MMM YYYY')} - ${dayjs(selectedRange?.end).format('DD MMM YYYY')}`
    : `${dayjs(selectedRange?.start).format('DD MMM YYYY')}`;

  return (
    <Modal
      title={
        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-cyan-500">
          Add New Holiday
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
    >
      <div className="mb-6 mt-2 pb-4 border-b border-gray-100">
        <p className="text-gray-500 text-sm">Selected Date(s):</p>
        <p className="text-lg font-semibold text-gray-800 mb-4">{dateText}</p>

        {/* Existing Holidays Section */}
        {existingHolidays && existingHolidays.length > 0 && (
          <div className="bg-red-50/50 rounded-xl p-4 border border-red-100 mb-2">
            <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">Existing Holidays</p>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {existingHolidays.map(hol => (
                <div key={hol.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-red-100/50 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{hol.holiday_name}</p>
                    <p className="text-xs text-gray-500">{dayjs(hol.holiday_date).format('DD MMM YYYY')}</p>
                  </div>
                  <Popconfirm
                    title="Delete Holiday"
                    description="Are you sure you want to delete this holiday?"
                    onConfirm={() => handleDelete(hol.id)}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{ danger: true, loading: isDeleting }}
                  >
                    <Button type="text" danger size="small" className="hover:bg-red-50">Delete</Button>
                  </Popconfirm>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          label={<span className="font-medium text-gray-700">Holiday Name</span>}
          rules={[{ required: true, message: 'Please enter the holiday name' }]}
        >
          <Input 
            placeholder="e.g. Idul Fitri" 
            size="large"
            className="rounded-xl border-gray-200 hover:border-purple-400 focus:border-purple-500" 
          />
        </Form.Item>

        <Form.Item className="mt-8 mb-0 flex justify-end">
          <Button onClick={onClose} className="mr-3 rounded-lg border-gray-200">
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isCreating}
            className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 border-none px-6"
          >
            Save Holiday
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
