import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getBookById } from "@/lib/db/repositories/books";
import { BookSchema } from "@/lib/books/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const { bookId } = params;

  const record = getBookById(bookId);
  if (!record) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // Parse genre from JSON string back to string[]
  let genre: string[];
  try {
    genre = JSON.parse(record.genre) as string[];
  } catch {
    genre = [record.genre];
  }

  // Read source JSON file to extract chapter stubs
  let chapterStubs: { id: number; title: string }[];
  try {
    const raw = fs.readFileSync(record.sourcePath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    const bookJson = BookSchema.parse(parsed);
    chapterStubs = bookJson.chapters.map((ch) => ({ id: ch.id, title: ch.title }));
  } catch (err) {
    console.error(`[GET /api/books/${bookId}] Failed to read source file:`, err);
    return NextResponse.json(
      { error: "Failed to load book content" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: record.id,
    title: record.title,
    author: record.author,
    genre,
    description: record.description,
    coverImage: record.coverImage,
    language: record.language,
    publishedYear: record.publishedYear,
    chapters: chapterStubs,
  });
}
