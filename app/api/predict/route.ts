import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { predictSchema } from '@/lib/validations';
import type { PredictionResult } from '@/types';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = predictSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { bookId } = result.data;

    // Verify book exists
    const book = await db.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check if user already has a rating for this book
    const existingRating = await db.userRating.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId,
        },
      },
    });

    if (existingRating) {
      const prediction: PredictionResult = {
        predictedRating: existingRating.rating,
        confidence: 1.0,
        rationale: [
          {
            type: 'existing_rating',
            message: 'You have already rated this book',
          },
        ],
      };
      return NextResponse.json(prediction);
    }

    // Count user's ratings to check if we have enough data
    const ratingCount = await db.userRating.count({
      where: { userId: session.user.id },
    });

    if (ratingCount < 5) {
      const prediction: PredictionResult = {
        predictedRating: null,
        confidence: null,
        rationale: [
          {
            type: 'insufficient_data',
            message: `Need at least 5 rated books to make predictions. You have ${ratingCount}.`,
          },
        ],
      };
      return NextResponse.json(prediction);
    }

    // TODO: Implement actual prediction algorithm in M2
    // For now, return a stub response
    const prediction: PredictionResult = {
      predictedRating: null,
      confidence: null,
      rationale: [
        {
          type: 'not_implemented',
          message: 'Prediction algorithm not yet implemented. Coming in M2.',
        },
      ],
    };

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: 'Prediction failed' },
      { status: 500 }
    );
  }
}
