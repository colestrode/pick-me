import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Papa from 'papaparse';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const MAX_PREVIEW_ROWS = 20;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const parseResult = Papa.parse(text, {
      header: false,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: 'Failed to parse CSV file' },
        { status: 400 }
      );
    }

    const rows = parseResult.data as string[][];
    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const previewRows = dataRows.slice(0, MAX_PREVIEW_ROWS);

    // Create import batch with raw data stored
    const batch = await db.importBatch.create({
      data: {
        userId: session.user.id,
        filename: file.name,
        status: 'pending',
        rawData: {
          headers,
          rows: dataRows,
        },
      },
    });

    return NextResponse.json({
      batchId: batch.id,
      filename: file.name,
      headers,
      rows: previewRows,
      totalRows: dataRows.length,
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file' },
      { status: 500 }
    );
  }
}
