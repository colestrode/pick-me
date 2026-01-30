'use client';

import { ChangeEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ImportPreview } from '@/types';

interface CsvUploaderProps {
  onUploadComplete: (preview: ImportPreview) => void;
}

export function CsvUploader({ onUploadComplete }: CsvUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Upload failed');
        return;
      }

      onUploadComplete(data);
    } catch {
      setError('Failed to upload file');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="lg">
      <h2 className="text-lg font-medium mb-4">Upload CSV File</h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
        Upload a CSV file exported from Goodreads, StoryGraph, or any other source
        with columns for title, author, and rating.
      </p>

      <label className="block">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full text-sm text-neutral-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-medium
            file:bg-neutral-100 file:text-neutral-700
            hover:file:bg-neutral-200
            dark:file:bg-neutral-800 dark:file:text-neutral-300
            dark:hover:file:bg-neutral-700
            disabled:opacity-50"
        />
      </label>

      {loading && (
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          Processing file...
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}
    </Card>
  );
}
