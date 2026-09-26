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
    <main>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-indigo-950 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
            Your AI-powered reading library.
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
            Describe any book you can imagine. Our AI writes it — chapter by
            chapter — in under two minutes.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link
              href="/generate"
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold px-7 py-3 rounded-xl text-sm transition-colors shadow-sm"
            >
              Generate a Book →
            </Link>
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-semibold px-7 py-3 rounded-xl text-sm transition-colors"
            >
              Browse Catalog
            </Link>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-2xl mx-auto">
            {[
              {
                icon: "⚡",
                label: "AI-Generated",
                desc: "Full books written by Claude via AWS Bedrock",
              },
              {
                icon: "📚",
                label: "Instant Library",
                desc: "Every book saved and ready to read",
              },
              {
                icon: "🎨",
                label: "Unique Covers",
                desc: "Beautiful text-based covers, no images needed",
              },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden="true">
                  {icon}
                </span>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800/50 border-y border-gray-100 dark:border-gray-700/50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <dl className="flex flex-col sm:flex-row justify-around gap-4 sm:gap-0 text-center">
            {[
              {
                value:
                  featuredBooks.length > 0
                    ? `${featuredBooks.length}+`
                    : "0",
                label: "Books Available",
              },
              { value: "5–12", label: "Chapters Each" },
              { value: "1–2 Min", label: "To Generate" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <dt className="text-2xl font-bold text-gray-900 dark:text-white">
                  {value}
                </dt>
                <dd className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* ── Books / empty state ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {featuredBooks.length > 0 ? (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recently Generated
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
        ) : (
          <section className="flex justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center max-w-md w-full">
              <span className="text-5xl block mb-4" aria-hidden="true">
                ✨
              </span>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No books yet
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Generate your first book to get started.
              </p>
              <Link
                href="/generate"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                Generate your first book →
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
