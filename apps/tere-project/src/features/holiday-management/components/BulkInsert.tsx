import { useState } from 'react';
import { useBulkCreateHolidays } from '../hooks/useHolidayQueries';
import { Button, message } from 'antd';
import { Database, FileJson } from 'lucide-react';
import { useThemeColors } from '@src/hooks/useTheme';

export default function BulkInsert() {
  const [jsonText, setJsonText] = useState('');
  const { mutateAsync: bulkCreate, isPending } = useBulkCreateHolidays();
  const T = useThemeColors();

  const handleInsert = async () => {
    try {
      if (!jsonText.trim()) {
        message.warning('Please enter JSON data first.');
        return;
      }

      const parsedData = JSON.parse(jsonText);
      if (!Array.isArray(parsedData)) {
        message.error('Invalid format. Root element must be an array.');
        return;
      }

      // Basic validation
      const isValid = parsedData.every(item => item.date && item.name && typeof item.date === 'string');
      if (!isValid) {
        message.error('Invalid format. Each item must have a "date" (string) and "name" (string).');
        return;
      }

      const res = await bulkCreate(parsedData);
      message.success(res.message || 'Bulk insert successful!');
      setJsonText('');
    } catch (e: any) {
      message.error('Invalid JSON structure. Please check and try again.');
    }
  };

  const accentTint = `${T.accent}15`;

  return (
    <div
      style={{
        background: T.cardBg,
        border: `1px solid ${T.cardBrd}`,
        borderRadius: 14,
      }}
      className="p-8 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          style={{ background: accentTint, color: T.accent, borderRadius: 10 }}
          className="p-3"
        >
          <Database size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: T.titleCol, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>
            Bulk Insert Holidays
          </h2>
          <p style={{ color: T.subCol, margin: '2px 0 0', fontSize: 12.5, fontFamily: "'Space Grotesk',sans-serif" }}>
            Paste a JSON array of dates to quickly import multiple holidays.
          </p>
        </div>
      </div>

      <div className="relative">
        <div style={{ color: T.subCol }} className="absolute top-4 right-4 pointer-events-none">
          <FileJson size={20} />
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder={'[\n  {\n    "date": "2026-01-01",\n    "name": "Tahun Baru 2026 Masehi"\n  }\n]'}
          style={{
            background: T.headBg,
            border: `1px solid ${T.cardBrd}`,
            color: T.rowCol,
            borderRadius: 12,
            fontFamily: "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace",
          }}
          className="w-full h-48 p-5 text-sm focus:outline-none transition-all resize-none placeholder:opacity-40"
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="primary"
          onClick={handleInsert}
          loading={isPending}
          style={{
            background: `linear-gradient(135deg, ${T.accent}, ${T.accentL})`,
            border: 'none',
            borderRadius: 10,
            height: 42,
            paddingInline: 28,
            fontWeight: 600,
            fontFamily: "'Space Grotesk',sans-serif",
            boxShadow: `0 4px 12px ${T.accent}30`,
          }}
        >
          Run Bulk Insert
        </Button>
      </div>
    </div>
  );
}
