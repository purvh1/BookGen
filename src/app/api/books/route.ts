import { NextRequest, NextResponse } from "next/server";
import { listBooks } from "@/lib/db/repositories/books";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const search = searchParams.get("search") ?? undefined;
  const genre = searchParams.get("genre") ?? undefined;
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");

  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 12;

  if (pageParam && isNaN(parseInt(pageParam, 10))) {
    return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
  }
  if (limitParam && isNaN(parseInt(limitParam, 10))) {
    return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 });
  }

  try {
    const { books, total } = listBooks({ search, genre, page, limit });

    // Parse genre from JSON string back to string[] for each book
    const booksWithParsedGenre = books.map((book) => ({
      ...book,
      genre: (() => {
        try {
          return JSON.parse(book.genre) as string[];
        } catch {
          return [book.genre];
        }
      })(),
    }));

    return NextResponse.json({
      books: booksWithParsedGenre,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("[GET /api/books] Error:", err);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}
