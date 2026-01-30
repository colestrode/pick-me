import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { searchBooks } from '@/lib/books/openlibrary';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const title = searchParams.get('title');
    const author = searchParams.get('author');

    if (!q && !title && !author) {
      return NextResponse.json(
        { error: 'At least one search parameter is required' },
        { status: 400 }
      );
    }

    const results = await searchBooks({
      q: q || undefined,
      title: title || undefined,
      author: author || undefined,
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Book search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
