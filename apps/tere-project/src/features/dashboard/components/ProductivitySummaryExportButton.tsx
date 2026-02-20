'use client';
import { Button } from 'antd';
import { FileExcelOutlined, LoadingOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useExportProductivitySummary } from '../hooks/useExportProductivitySummary';
import { motion } from 'framer-motion';

interface ProductivitySummaryExportButtonProps {
  month: number;
  year: number;
  onSuccess?: (spreadsheetUrl: string) => void;
  onError?: () => void;
}

export function ProductivitySummaryExportButton({ month, year, onSuccess, onError }: ProductivitySummaryExportButtonProps) {
  const { startExportFlow, isExporting } = useExportProductivitySummary();
  const [isHovered, setIsHovered] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleExport = async () => {
    try {
      const result = await startExportFlow(month, year);

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // Notify parent component
      if (result?.spreadsheetUrl) {
        onSuccess?.(result.spreadsheetUrl);
        // Also open spreadsheet in new tab
        window.open(result.spreadsheetUrl, '_blank');
      }
    } catch (error) {
      // Notify parent component of error
      onError?.();
      console.error('Export failed:', error);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative"
    >
      <Button
        type="primary"
        icon={
          isExporting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              <LoadingOutlined />
            </motion.div>
          ) : showSuccess ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              ✓
            </motion.div>
          ) : (
            <motion.div
              animate={isHovered ? { y: [-2, 2, -2] } : { y: 0 }}
              transition={{ duration: 0.5, repeat: isHovered ? Infinity : 0 }}
            >
              <FileExcelOutlined />
            </motion.div>
          )
        }
        onClick={handleExport}
        disabled={isExporting}
        className="relative overflow-hidden"
        style={{
          background: showSuccess
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #0f9d58 0%, #0b8043 100%)',
          border: 'none',
          boxShadow: isHovered
            ? '0 8px 16px rgba(15, 157, 88, 0.4)'
            : '0 4px 8px rgba(15, 157, 88, 0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        <motion.span
          animate={isExporting ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
          transition={{ duration: 1.5, repeat: isExporting ? Infinity : 0 }}
        >
          {isExporting
            ? 'Exporting...'
            : showSuccess
              ? 'Success!'
              : 'Export to Google Spreadsheet'}
        </motion.span>

        {/* Shimmer effect */}
        {isHovered && !isExporting && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Pulse effect when exporting */}
        {isExporting && (
          <>
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 bg-white/20 rounded"
              style={{ pointerEvents: 'none' }}
            />
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              className="absolute inset-0 bg-white/20 rounded"
              style={{ pointerEvents: 'none' }}
            />
          </>
        )}
      </Button>
    </motion.div>
  );
}
