'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

interface ExportToastProps {
  show: boolean;
  type: 'success' | 'error';
  spreadsheetUrl?: string;
  onClose: () => void;
}

export function ExportToast({ show, type, spreadsheetUrl, onClose }: ExportToastProps) {
  if (!show) return null;

  const isSuccess = type === 'success';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 100 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="fixed bottom-8 right-8 z-50"
          style={{ maxWidth: '400px' }}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            className="relative rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: isSuccess
                ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: isSuccess ? '2px solid #86efac' : '2px solid #fca5a5',
            }}
          >
            {/* Animated background waves */}
            <motion.div
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: isSuccess
                  ? 'linear-gradient(45deg, #10b981 25%, transparent 25%, transparent 75%, #10b981 75%, #10b981), linear-gradient(45deg, #10b981 25%, transparent 25%, transparent 75%, #10b981 75%, #10b981)'
                  : 'linear-gradient(45deg, #ef4444 25%, transparent 25%, transparent 75%, #ef4444 75%, #ef4444), linear-gradient(45deg, #ef4444 25%, transparent 25%, transparent 75%, #ef4444 75%, #ef4444)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
              }}
            />

            <div className="relative p-6">
              {/* Icon with bounce animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                className="flex items-center gap-4"
              >
                <motion.div
                  animate={
                    isSuccess
                      ? { rotate: [0, 10, -10, 10, 0] }
                      : { rotate: [0, -5, 5, -5, 0] }
                  }
                  transition={{ duration: 0.5, delay: 0.3 }}
                  style={{
                    fontSize: '48px',
                    color: isSuccess ? '#10b981' : '#ef4444',
                  }}
                >
                  {isSuccess ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                </motion.div>

                <div className="flex-1">
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg font-bold"
                    style={{ color: isSuccess ? '#047857' : '#dc2626' }}
                  >
                    {isSuccess ? 'Export Berhasil!' : 'Export Gagal!'}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm mt-1"
                    style={{ color: isSuccess ? '#065f46' : '#991b1b' }}
                  >
                    {isSuccess ? (
                      <>
                        Data cuti berhasil diexport dan bisa dibuka di Google Drive anda atau{' '}
                        <motion.a
                          href={spreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="font-semibold underline"
                          style={{ color: '#0f9d58' }}
                        >
                          klik link berikut
                        </motion.a>
                      </>
                    ) : (
                      'Terjadi kendala pada sistem. Ulangi beberapa saat lagi atau hubungi admin'
                    )}
                  </motion.p>
                </div>

                {/* Close button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                  style={{ cursor: 'pointer' }}
                >
                  ×
                </motion.button>
              </motion.div>

              {/* Animated progress bar */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mt-4 h-1 rounded-full"
                style={{
                  background: isSuccess
                    ? 'linear-gradient(90deg, #10b981, #0f9d58)'
                    : 'linear-gradient(90deg, #ef4444, #dc2626)',
                  transformOrigin: 'left',
                }}
              />
            </div>

            {/* Sparkles effect for success */}
            {isSuccess && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      rotate: [0, 180, 360],
                      x: [0, Math.cos((i * Math.PI * 2) / 8) * 100],
                      y: [0, Math.sin((i * Math.PI * 2) / 8) * 100],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 0.5 + i * 0.1,
                      ease: 'easeOut',
                    }}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: '8px',
                      height: '8px',
                      background: '#10b981',
                      borderRadius: '50%',
                      pointerEvents: 'none',
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
