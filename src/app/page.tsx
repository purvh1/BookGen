import Link from "next/link";
import BookGrid from "@/components/catalog/BookGrid";
import type { BookCardProps } from "@/components/catalog/BookCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BooksApiResponse {
  books: Array<{
    id: string;
    title: string;
    author: string;
    genre: string | string[];
    description: string;
    coverImage: string;
    chapterCount: number;
  }>;
  total: number;
  page: number;
  limit: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseGenre(raw: string | string[]): string[] {
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [raw];
  }
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`
  );
}

async function fetchFeaturedBooks(): Promise<BookCardProps[]> {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/books?limit=8&page=1`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as BooksApiResponse;
    return data.books.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      genre: parseGenre(b.genre),
      description: b.description,
      coverImage: b.coverImage,
      chapterCount: b.chapterCount,
    }));
  } catch {
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const featuredBooks = await fetchFeaturedBooks();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          Read the world&apos;s great books — free.
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-6">
          Track your progress, bookmark chapters, and highlight passages across
          your entire library.
        </p>
        <Link
          href="/catalog"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          Browse Catalog
        </Link>
      </section>

      {/* Featured books */}
      {featuredBooks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Featured Books
            </h2>
            <Link
              href="/catalog"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              View all →
            </Link>
          </div>
          <BookGrid books={featuredBooks} />
        </section>
      )}

      {/* Empty state */}
      {featuredBooks.length === 0 && (
        <section className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No books loaded yet. Add JSON files to{" "}
            <code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              data/books/
            </code>{" "}
            and restart the server.
          </p>
        </section>
      )}
    </main>
  );
}
