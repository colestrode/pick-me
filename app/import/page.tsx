'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CsvUploader } from '@/components/CsvUploader';
import { ColumnMapper } from '@/components/ColumnMapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { ImportPreview, ImportStats } from '@/types';

export default function ImportPage() {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [stats, setStats] = useState<ImportStats | null>(null);

  if (stats) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card padding="lg">
          <h1 className="text-2xl font-semibold mb-4">Import Complete</h1>
          <div className="space-y-2 mb-6">
            <p>
              <span className="font-medium">Total rows:</span> {stats.total}
            </p>
            <p>
              <span className="font-medium text-green-600 dark:text-green-400">
                Imported:
              </span>{' '}
              {stats.imported}
            </p>
            {stats.skipped > 0 && (
              <p>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">
                  Skipped:
                </span>{' '}
                {stats.skipped}
              </p>
            )}
            {stats.errors > 0 && (
              <p>
                <span className="font-medium text-red-600 dark:text-red-400">
                  Errors:
                </span>{' '}
                {stats.errors}
              </p>
            )}
          </div>
          <div className="flex gap-4">
            <Button onClick={() => { setPreview(null); setStats(null); }}>
              Import Another
            </Button>
            <Link href="/search">
              <Button variant="secondary">Go to Search</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Import Ratings</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Import your reading history from a CSV file
        </p>
      </div>

      {!preview ? (
        <CsvUploader onUploadComplete={setPreview} />
      ) : (
        <ColumnMapper preview={preview} onCommitComplete={setStats} />
      )}
    </div>
  );
}
