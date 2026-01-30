'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { BookCard } from '@/components/BookCard';
import type { BookCandidate } from '@/types';
import type { Book } from '@prisma/client';

export default function SearchPage() {
  const router = useRouter();
  const [isbn, setIsbn] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleIsbnLookup() {
    if (!isbn.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch(`/api/books/isbn/${encodeURIComponent(isbn.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Lookup failed');
        return;
      }

      const book: Book = data.book;
      router.push(`/books/${book.id}`);
    } catch {
      setError('Failed to lookup ISBN');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Search failed');
        return;
      }

      setResults(data.results);
    } catch {
      setError('Failed to search books');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectBook(book: BookCandidate) {
    if (book.isbn13) {
      setLoading(true);
      try {
        const response = await fetch(`/api/books/isbn/${book.isbn13}`);
        const data = await response.json();

        if (response.ok) {
          router.push(`/books/${data.book.id}`);
          return;
        }
      } catch {
        // Fall through to create from candidate
      }
    }

    // If no ISBN or lookup failed, we need to create from candidate data
    // For now, just show an error - full implementation would POST to create
    setError('Unable to save book. Try searching by ISBN.');
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Search Books</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Look up a book by ISBN or search by title/author
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card padding="lg">
          <h2 className="text-lg font-medium mb-4">ISBN Lookup</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Enter ISBN..."
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleIsbnLookup()}
            />
            <Button onClick={handleIsbnLookup} disabled={loading}>
              Lookup
            </Button>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-lg font-medium mb-4">Title/Author Search</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Search books..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              Search
            </Button>
          </div>
        </Card>
      </div>

      {error && (
        <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </Card>
      )}

      {loading && (
        <p className="text-center text-neutral-600 dark:text-neutral-400">
          Loading...
        </p>
      )}

      {results.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-4">
            Results ({results.length})
          </h2>
          <div className="grid gap-4">
            {results.map((book) => (
              <BookCard
                key={book.externalId}
                book={book}
                onClick={() => handleSelectBook(book)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
