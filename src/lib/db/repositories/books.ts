import { getDb } from "../index";
import type { BookRecord } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UpsertBookInput {
  id: string;
  title: string;
  author: string;
  /** string[] serialised to JSON before storage */
  genre: string[];
  description: string;
  coverImage: string;
  language: string;
  publishedYear: number;
  chapterCount: number;
  filePath: string;
}

export interface ListBooksOptions {
  search?: string;
  genre?: string;
  page?: number;
  limit?: number;
}

interface BookRow {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string | null;
  cover_image: string | null;
  language: string;
  published_year: number | null;
  chapter_count: number;
  file_path: string;
  indexed_at: number;
}

// ─── Row → BookRecord mapper ──────────────────────────────────────────────────

function rowToBookRecord(row: BookRow): BookRecord {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    genre: row.genre,
    description: row.description ?? "",
    coverImage: row.cover_image ?? "",
    language: row.language,
    publishedYear: row.published_year ?? 0,
    chapterCount: row.chapter_count,
    sourcePath: row.file_path,
    createdAt: new Date(row.indexed_at * 1000).toISOString(),
    updatedAt: new Date(row.indexed_at * 1000).toISOString(),
  };
}

// ─── Repository functions ─────────────────────────────────────────────────────

/**
 * Insert or replace a book row (used by the book loader on startup).
 */
export function upsertBook(input: UpsertBookInput): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO books
      (id, title, author, genre, description, cover_image, language, published_year,
       chapter_count, file_path, indexed_at)
    VALUES
      (@id, @title, @author, @genre, @description, @coverImage, @language, @publishedYear,
       @chapterCount, @filePath, unixepoch())
  `);
  stmt.run({
    ...input,
    genre: JSON.stringify(input.genre),
  });
}

/**
 * List books with optional full-text search, genre filter, and pagination.
 * Returns the matching rows and the total count (pre-pagination).
 */
export function listBooks(options: ListBooksOptions = {}): {
  books: BookRecord[];
  total: number;
} {
  const db = getDb();
  const { search, genre, page = 1, limit = 12 } = options;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (search) {
    conditions.push("(title LIKE @search OR author LIKE @search)");
    params.search = `%${search}%`;
  }

  if (genre) {
    // genre column stores a JSON array string like '["Fiction","Adventure"]'
    conditions.push("genre LIKE @genre");
    params.genre = `%"${genre}"%`;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = db
    .prepare<Record<string, unknown>, { count: number }>(
      `SELECT COUNT(*) as count FROM books ${where}`
    )
    .get(params);

  const total = countRow?.count ?? 0;

  const rows = db
    .prepare<Record<string, unknown>, BookRow>(
      `SELECT * FROM books ${where} ORDER BY title ASC LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit, offset });

  return { books: rows.map(rowToBookRecord), total };
}

/**
 * Fetch a single book by its slug ID. Returns null if not found.
 */
export function getBookById(id: string): BookRecord | null {
  const db = getDb();
  const row = db
    .prepare<{ id: string }, BookRow>("SELECT * FROM books WHERE id = @id")
    .get({ id });
  return row ? rowToBookRecord(row) : null;
}
