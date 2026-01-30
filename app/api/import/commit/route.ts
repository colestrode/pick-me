import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { importCommitSchema, normalizeRating, normalizeIsbn } from '@/lib/validations';

interface RawData {
  headers: string[];
  rows: string[][];
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = importCommitSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { batchId, columnMap } = result.data;

    const batch = await db.importBatch.findFirst({
      where: {
        id: batchId,
        userId: session.user.id,
        status: 'pending',
      },
    });

    if (!batch || !batch.rawData) {
      return NextResponse.json(
        { error: 'Import batch not found or already processed' },
        { status: 404 }
      );
    }

    const rawData = batch.rawData as unknown as RawData;
    const { headers, rows } = rawData;

    // Get column indices
    const titleIdx = headers.indexOf(columnMap.title);
    const authorIdx = headers.indexOf(columnMap.author);
    const ratingIdx = headers.indexOf(columnMap.rating);
    const isbnIdx = columnMap.isbn ? headers.indexOf(columnMap.isbn) : -1;

    if (titleIdx === -1 || authorIdx === -1 || ratingIdx === -1) {
      return NextResponse.json(
        { error: 'Invalid column mapping' },
        { status: 400 }
      );
    }

    let imported = 0;
    let errors = 0;
    let skipped = 0;

    for (const row of rows) {
      try {
        const title = row[titleIdx]?.trim();
        const author = row[authorIdx]?.trim();
        const ratingStr = row[ratingIdx]?.trim();
        const isbn = isbnIdx >= 0 ? row[isbnIdx]?.trim() : null;

        if (!title || !author || !ratingStr) {
          skipped++;
          continue;
        }

        const ratingNum = parseFloat(ratingStr);
        if (isNaN(ratingNum)) {
          skipped++;
          continue;
        }

        const rating = normalizeRating(ratingNum);
        const isbn13 = isbn ? normalizeIsbn(isbn) : null;

        // Find or create book
        let book = isbn13
          ? await db.book.findUnique({ where: { isbn13 } })
          : await db.book.findFirst({
              where: {
                title: { equals: title, mode: 'insensitive' },
                authors: { has: author },
              },
            });

        if (!book) {
          book = await db.book.create({
            data: {
              title,
              authors: [author],
              isbn13,
            },
          });
        }

        // Create or update rating
        await db.userRating.upsert({
          where: {
            userId_bookId: {
              userId: session.user.id,
              bookId: book.id,
            },
          },
          update: {
            rating,
            source: 'import',
            importBatchId: batchId,
          },
          create: {
            userId: session.user.id,
            bookId: book.id,
            rating,
            source: 'import',
            importBatchId: batchId,
          },
        });

        imported++;
      } catch (err) {
        console.error('Row import error:', err);
        errors++;
      }
    }

    // Update batch status
    await db.importBatch.update({
      where: { id: batchId },
      data: {
        status: 'committed',
        columnMap,
        stats: {
          total: rows.length,
          imported,
          errors,
          skipped,
        },
        rawData: Prisma.JsonNull, // Clear raw data after commit
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        total: rows.length,
        imported,
        errors,
        skipped,
      },
    });
  } catch (error) {
    console.error('Import commit error:', error);
    return NextResponse.json(
      { error: 'Failed to commit import' },
      { status: 500 }
    );
  }
}
