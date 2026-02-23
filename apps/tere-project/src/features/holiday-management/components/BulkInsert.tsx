import React, { useState } from 'react';
import { useBulkCreateHolidays } from '../hooks/useHolidayQueries';
import { Button, message } from 'antd';
import { Database, FileJson } from 'lucide-react';

export default function BulkInsert() {
  const [jsonText, setJsonText] = useState('');
  const { mutateAsync: bulkCreate, isPending } = useBulkCreateHolidays();

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

  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <Database size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Bulk Insert Holidays</h2>
          <p className="text-sm text-gray-500 mt-1">Paste a JSON array of dates to quickly import multiple holidays.</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-4 right-4 text-gray-400 pointer-events-none">
          <FileJson size={20} />
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder="[\n  {\n    &quot;date&quot;: &quot;2026-01-01&quot;,\n    &quot;name&quot;: &quot;Tahun Baru 2026 Masehi&quot;\n  }\n]"
          className="w-full h-48 p-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none placeholder:text-gray-300"
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="primary"
          onClick={handleInsert}
          loading={isPending}
          className="h-11 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 border-none font-semibold shadow-md shadow-blue-500/20"
        >
          Run Bulk Insert
        </Button>
      </div>
    </div>
  );
}
