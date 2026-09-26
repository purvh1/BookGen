import { getDb } from "../index";
import type { ReadingProgress } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UpsertProgressInput {
  userId: number;
  bookId: string;
  chapterId: number;
  scrollOffset?: number;
}

interface ProgressRow {
  id: number;
  user_id: number;
  book_id: string;
  chapter_id: number;
  scroll_offset: number;
  updated_at: number;
}

// ─── Row → ReadingProgress mapper ────────────────────────────────────────────

function rowToProgress(row: ProgressRow): ReadingProgress {
  return {
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    chapterId: row.chapter_id,
    scrollOffset: row.scroll_offset,
    updatedAt: new Date(row.updated_at * 1000).toISOString(),
  };
}

// ─── Repository functions ─────────────────────────────────────────────────────

/**
 * Get the reading progress for a specific user + book.
 * Returns null if the user has never opened this book.
 */
export function getProgress(
  userId: number,
  bookId: string
): ReadingProgress | null {
  const db = getDb();
  const row = db
    .prepare<{ userId: number; bookId: string }, ProgressRow>(
      `SELECT * FROM reading_progress
       WHERE user_id = @userId AND book_id = @bookId`
    )
    .get({ userId, bookId });
  return row ? rowToProgress(row) : null;
}

/**
 * Create or update reading progress (UNIQUE on user_id + book_id).
 */
export function upsertProgress(input: UpsertProgressInput): ReadingProgress {
  const db = getDb();
  db.prepare(`
    INSERT INTO reading_progress (user_id, book_id, chapter_id, scroll_offset, updated_at)
    VALUES (@userId, @bookId, @chapterId, @scrollOffset, unixepoch())
    ON CONFLICT(user_id, book_id) DO UPDATE SET
      chapter_id    = excluded.chapter_id,
      scroll_offset = excluded.scroll_offset,
      updated_at    = unixepoch()
  `).run({
    userId: input.userId,
    bookId: input.bookId,
    chapterId: input.chapterId,
    scrollOffset: input.scrollOffset ?? 0,
  });

  // Return the current (just-upserted) row
  const row = db
    .prepare<{ userId: number; bookId: string }, ProgressRow>(
      `SELECT * FROM reading_progress
       WHERE user_id = @userId AND book_id = @bookId`
    )
    .get({ userId: input.userId, bookId: input.bookId });

  if (!row) throw new Error("Failed to retrieve upserted progress row");
  return rowToProgress(row);
}

/**
 * Return the N most recently read books for a user (for the "Continue Reading" section).
 * Ordered by updated_at DESC.
 */
export function getRecentlyRead(
  userId: number,
  limit = 3
): ReadingProgress[] {
  const db = getDb();
  const rows = db
    .prepare<{ userId: number; limit: number }, ProgressRow>(
      `SELECT * FROM reading_progress
       WHERE user_id = @userId
       ORDER BY updated_at DESC
       LIMIT @limit`
    )
    .all({ userId, limit });
  return rows.map(rowToProgress);
}
