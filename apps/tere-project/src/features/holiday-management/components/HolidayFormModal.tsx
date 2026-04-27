import React, { useState, useEffect } from 'react';
import { Modal, Input, Form, message, Popconfirm } from 'antd';
import { useCreateHoliday, useDeleteHoliday } from '../hooks/useHolidayQueries';
import { useThemeColors } from '@src/hooks/useTheme';
import dayjs from 'dayjs';

const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";
const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

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
  const { isDark, accent, cardBg, cardBrd, titleCol, subCol, rowCol, headBg } = useThemeColors();

  const handleDelete = async (id: string) => {
    try {
      await deleteHoliday(id);
      message.success('Holiday deleted');
      onClose();
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
      title={null}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      width={480}
      className="tere-modal"
      styles={{
        content: {
          background: cardBg,
          border: '1px solid ' + cardBrd,
          borderRadius: 14,
          padding: 0,
        },
        mask: {
          backdropFilter: 'blur(8px)',
          background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)',
        },
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 24px 0' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: titleCol, margin: 0, fontFamily: sans }}>
          Add New Holiday
        </h3>
        <p style={{ color: subCol, fontSize: 12.5, fontFamily: sans, marginTop: 4 }}>
          Selected: {dateText}
        </p>
      </div>

      {/* Existing Holidays Section */}
      {existingHolidays && existingHolidays.length > 0 && (
        <div style={{
          background: isDark ? '#2a0f10' : '#fff5f5',
          borderRadius: 10,
          padding: 14,
          border: '1px solid ' + (isDark ? '#ef444420' : '#fecaca'),
          margin: '16px 24px',
        }}>
          <div style={{
            color: '#ef4444',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontFamily: sans,
            marginBottom: 8,
          }}>
            Existing Holidays
          </div>
          <div style={{ maxHeight: 160, overflowY: 'auto' }}>
            {existingHolidays.map(hol => (
              <div key={hol.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: cardBg, padding: '8px 12px', borderRadius: 8,
                border: '1px solid ' + cardBrd, marginBottom: 6,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: rowCol, fontFamily: sans }}>
                    {hol.holiday_name}
                  </div>
                  <div style={{ fontSize: 11, color: subCol, fontFamily: mono }}>
                    {dayjs(hol.holiday_date).format('DD MMM YYYY')}
                  </div>
                </div>
                <Popconfirm
                  title="Delete Holiday"
                  description="Are you sure you want to delete this holiday?"
                  onConfirm={() => handleDelete(hol.id)}
                  okText="Yes"
                  cancelText="No"
                  okButtonProps={{ danger: true, loading: isDeleting }}
                >
                  <button style={{
                    background: isDark ? '#2a0f10' : '#fff5f5',
                    color: '#ef4444',
                    border: 'none',
                    borderRadius: 6,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: sans,
                  }}>
                    Delete
                  </button>
                </Popconfirm>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: cardBrd, margin: '0 24px' }} />

      {/* Form section */}
      <div style={{ padding: '16px 24px 20px' }} className="tere-input">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label={
              <span style={{
                color: subCol,
                fontWeight: 600,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontFamily: sans,
              }}>
                Holiday Name
              </span>
            }
            rules={[{ required: true, message: 'Please enter the holiday name' }]}
          >
            <Input
              placeholder="e.g. Idul Fitri"
              size="large"
              style={{
                background: headBg,
                borderColor: cardBrd,
                borderRadius: 8,
                color: rowCol,
                fontFamily: sans,
              }}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid ' + cardBrd,
                color: subCol,
                borderRadius: 8,
                padding: '6px 16px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                fontFamily: sans,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              style={{
                background: accent,
                border: 'none',
                color: '#fff',
                borderRadius: 8,
                padding: '6px 20px',
                cursor: isCreating ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 13,
                fontFamily: sans,
                opacity: isCreating ? 0.65 : 1,
              }}
            >
              {isCreating ? 'Saving...' : 'Save Holiday'}
            </button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
