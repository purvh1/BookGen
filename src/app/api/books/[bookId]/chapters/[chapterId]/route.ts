import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getBookById } from "@/lib/db/repositories/books";
import { BookSchema } from "@/lib/books/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: { bookId: string; chapterId: string } }
) {
  const { bookId, chapterId: chapterIdStr } = params;

  // Parse chapterId to a number
  const chapterId = parseInt(chapterIdStr, 10);
  if (isNaN(chapterId) || chapterId < 1) {
    return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 });
  }

  // Look up book in DB
  const record = getBookById(bookId);
  if (!record) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // Read and parse source JSON file
  let bookJson: ReturnType<typeof BookSchema.parse>;
  try {
    const raw = fs.readFileSync(record.sourcePath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    bookJson = BookSchema.parse(parsed);
  } catch (err) {
    console.error(
      `[GET /api/books/${bookId}/chapters/${chapterId}] Failed to read source file:`,
      err
    );
    return NextResponse.json(
      { error: "Failed to load book content" },
      { status: 500 }
    );
  }

  // Find the matching chapter by id
  const chapter = bookJson.chapters.find((ch) => ch.id === chapterId);
  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  return NextResponse.json({
    chapter: {
      id: chapter.id,
      title: chapter.title,
      content: chapter.content,
    },
  });
}
