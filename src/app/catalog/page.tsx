import { Suspense } from "react";
import BookGrid from "@/components/catalog/BookGrid";
import CatalogFilters from "@/components/catalog/CatalogFilters";
import PaginationControls from "@/components/catalog/PaginationControls";
import type { BookCardProps } from "@/components/catalog/BookCard";

interface CatalogPageProps {
  searchParams: {
    search?: string;
    genre?: string;
    page?: string;
  };
}

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

async function fetchBooks(
  search: string,
  genre: string,
  page: number,
  limit: number
): Promise<BooksApiResponse> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (genre) params.set("genre", genre);
  params.set("page", String(page));
  params.set("limit", String(limit));

  // Server-side fetch — use absolute URL via env or relative path with base
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`;

  const res = await fetch(`${baseUrl}/api/books?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return { books: [], total: 0, page, limit };
  }

  return res.json() as Promise<BooksApiResponse>;
}

/** Collect all unique genres from the current book list */
function extractGenres(books: BooksApiResponse["books"]): string[] {
  const set = new Set<string>();
  for (const book of books) {
    const genres = Array.isArray(book.genre)
      ? book.genre
      : parseGenre(book.genre);
    genres.forEach((g) => set.add(g));
  }
  return Array.from(set).sort();
}

function parseGenre(raw: string | string[]): string[] {
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [raw];
  }
}

const LIMIT = 12;

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const search = searchParams.search ?? "";
  const genre = searchParams.genre ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const data = await fetchBooks(search, genre, page, LIMIT);

  // Map API response to BookCardProps
  const books: BookCardProps[] = data.books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    genre: parseGenre(b.genre),
    description: b.description,
    coverImage: b.coverImage,
    chapterCount: b.chapterCount,
  }));

  // For the genre filter we fetch all genres (page 1, large limit, no filter)
  const allBooksData = await fetchBooks("", "", 1, 200);
  const allGenres = extractGenres(allBooksData.books);

  const totalPages = Math.ceil(data.total / LIMIT);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          Catalog
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.total} book{data.total !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Filters — wrapped in Suspense because CatalogFilters uses useSearchParams */}
      <div className="mb-6">
        <Suspense fallback={<div className="h-10" />}>
          <CatalogFilters
            genres={allGenres}
            initialSearch={search}
            initialGenre={genre}
          />
        </Suspense>
      </div>

      {/* Book grid */}
      <BookGrid books={books} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8">
          <Suspense fallback={null}>
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              basePath="/catalog"
              currentParams={{ search, genre }}
            />
          </Suspense>
        </div>
      )}
    </main>
  );
}
