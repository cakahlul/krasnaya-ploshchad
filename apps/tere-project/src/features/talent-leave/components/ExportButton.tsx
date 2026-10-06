'use client';
import { Button, App } from 'antd';
import { FileExcelOutlined, LoadingOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useExportTalentLeave } from '../hooks/useExportTalentLeave';
import { useTalentLeaveStore } from '../store/talentLeaveStore';
import { useThemeColors } from '@src/hooks/useTheme';

interface ExportButtonProps {
  onSuccess?: (spreadsheetUrl: string) => void;
  onError?: () => void;
  canExport?: boolean;
}

export function ExportButton({ onSuccess, onError, canExport = false }: ExportButtonProps) {
  const { dateRangeStart, dateRangeEnd } = useTalentLeaveStore();
  const { startExportFlow, isExporting } = useExportTalentLeave();
  const [showSuccess, setShowSuccess] = useState(false);
  const { notification } = App.useApp();
  const { accent } = useThemeColors();

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleExport = async () => {
    const startDate = formatDate(dateRangeStart);
    const endDate = formatDate(dateRangeEnd);

    try {
      const result = await startExportFlow(startDate, endDate);

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // Notify user via Ant Design notification
      if (result?.spreadsheetUrl) {
        notification.success({
          message: 'Export Successful',
          description: (
            <span>
              The Talent Leave details have been exported to Google Drive.{' '}
              <a
                href={result.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: accent, textDecoration: 'underline', fontWeight: 500 }}
              >
                Open Spreadsheet
              </a>
            </span>
          ),
          duration: 9,
          placement: 'topRight',
        });
      }

      // Notify parent component
      if (result?.spreadsheetUrl) {
        onSuccess?.(result.spreadsheetUrl);
        // Also open spreadsheet in new tab automatically
        window.open(result.spreadsheetUrl, '_blank');
      }
    } catch (error) {
      notification.error({
        message: 'Export Failed',
        description: 'An error occurred while exporting the spreadsheet. Please try again.',
        duration: 9,
        placement: 'topRight',
      });

      // Notify parent component of error
      onError?.();
      console.error('Export failed:', error);
    }
  };

  return (
    <div>
      <Button
        type="primary"
        icon={isExporting ? <LoadingOutlined spin /> : showSuccess ? '✓' : <FileExcelOutlined />}
        onClick={handleExport}
        disabled={isExporting || !canExport}
        style={{
          background: showSuccess ? '#059669' : '#0f9d58',
          border: 'none',
        }}
      >
        {isExporting ? 'Exporting…' : !canExport ? 'Lead only' : showSuccess ? 'Export ready' : 'Export to Google Spreadsheet'}
      </Button>
    </div>
  );
}
