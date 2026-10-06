'use client';

interface ExportToastProps {
  show: boolean;
  type: 'success' | 'error';
  spreadsheetUrl?: string;
  onClose: () => void;
}

export function ExportToast({ show, type, spreadsheetUrl, onClose }: ExportToastProps) {
  if (!show) return null;
  const success = type === 'success';
  return (
    <aside role="status" className="fixed bottom-6 right-6 z-50 w-[min(24rem,calc(100vw-3rem))] rounded-xl border p-4 shadow-lg" style={{ background: success ? '#f0fdf4' : '#fef2f2', borderColor: success ? '#86efac' : '#fca5a5', color: success ? '#166534' : '#991b1b' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-sm font-semibold">{success ? 'Leave export ready' : 'Leave export failed'}</p>
          <p className="mb-0 mt-1 text-sm">{success ? 'The spreadsheet is ready to open.' : 'Try again or contact an administrator.'}</p>
          {success && spreadsheetUrl && <a className="mt-2 inline-block text-sm font-semibold underline" href={spreadsheetUrl} target="_blank" rel="noopener noreferrer">Open spreadsheet</a>}
        </div>
        <button type="button" onClick={onClose} aria-label="Close export notice" className="text-lg leading-none">×</button>
      </div>
    </aside>
  );
}
