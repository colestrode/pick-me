'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ImportPreview, ColumnMapping, ImportStats } from '@/types';

interface ColumnMapperProps {
  preview: ImportPreview;
  onCommitComplete: (stats: ImportStats) => void;
}

const REQUIRED_FIELDS = ['title', 'author', 'rating'] as const;
const OPTIONAL_FIELDS = ['isbn', 'date'] as const;
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS] as const;

type FieldKey = (typeof ALL_FIELDS)[number];

const FIELD_LABELS: Record<FieldKey, string> = {
  title: 'Title',
  author: 'Author',
  rating: 'Rating',
  isbn: 'ISBN (optional)',
  date: 'Date Read (optional)',
};

export function ColumnMapper({ preview, onCommitComplete }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isComplete = REQUIRED_FIELDS.every((field) => mapping[field]);

  async function handleCommit() {
    if (!isComplete) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: preview.batchId,
          columnMap: mapping,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Import failed');
        return;
      }

      onCommitComplete(data.stats);
    } catch {
      setError('Failed to import ratings');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="lg">
      <h2 className="text-lg font-medium mb-4">Map Columns</h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
        Select which column in your CSV corresponds to each field.
        {preview.filename && ` File: ${preview.filename}`}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {ALL_FIELDS.map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {FIELD_LABELS[field]}
            </label>
            <select
              value={mapping[field] || ''}
              onChange={(e) =>
                setMapping((prev) => ({
                  ...prev,
                  [field]: e.target.value || undefined,
                }))
              }
              className="w-full px-3 py-2 border rounded-md
                bg-white dark:bg-neutral-900
                border-neutral-300 dark:border-neutral-700
                text-neutral-900 dark:text-neutral-100
                focus:outline-none focus:ring-2 focus:ring-neutral-500"
            >
              <option value="">Select column...</option>
              {preview.headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Preview ({preview.totalRows} rows total)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-800">
                {preview.headers.map((header) => (
                  <th
                    key={header}
                    className="px-3 py-2 text-left font-medium border border-neutral-200 dark:border-neutral-700"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.slice(0, 5).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 truncate max-w-[200px]"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-500">{error}</p>
      )}

      <Button
        onClick={handleCommit}
        disabled={!isComplete || loading}
      >
        {loading ? 'Importing...' : 'Commit Import'}
      </Button>
    </Card>
  );
}
