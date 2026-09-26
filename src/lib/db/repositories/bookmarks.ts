import { getDb } from "../index";
import type { Bookmark } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddBookmarkInput {
  userId: number;
  bookId: string;
  chapterId: number;
  label?: string;
}

interface BookmarkRow {
  id: number;
  user_id: number;
  book_id: string;
  chapter_id: number;
  label: string | null;
  created_at: number;
}

// ─── Row → Bookmark mapper ────────────────────────────────────────────────────

function rowToBookmark(row: BookmarkRow): Bookmark {
  return {
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    chapterId: row.chapter_id,
    label: row.label ?? undefined,
    createdAt: new Date(row.created_at * 1000).toISOString(),
  };
}

// ─── Repository functions ─────────────────────────────────────────────────────

/**
 * List all bookmarks for a user on a specific book, sorted by chapter order.
 */
export function listBookmarks(userId: number, bookId: string): Bookmark[] {
  const db = getDb();
  const rows = db
    .prepare<{ userId: number; bookId: string }, BookmarkRow>(
      `SELECT * FROM bookmarks
       WHERE user_id = @userId AND book_id = @bookId
       ORDER BY chapter_id ASC, created_at ASC`
    )
    .all({ userId, bookId });
  return rows.map(rowToBookmark);
}

/**
 * Add a new bookmark. Returns the created Bookmark.
 */
export function addBookmark(input: AddBookmarkInput): Bookmark {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO bookmarks (user_id, book_id, chapter_id, label)
       VALUES (@userId, @bookId, @chapterId, @label)`
    )
    .run({
      userId: input.userId,
      bookId: input.bookId,
      chapterId: input.chapterId,
      label: input.label ?? null,
    });

  const row = db
    .prepare<{ id: number }, BookmarkRow>(
      "SELECT * FROM bookmarks WHERE id = @id"
    )
    .get({ id: result.lastInsertRowid as number });

  if (!row) throw new Error("Failed to retrieve newly created bookmark");
  return rowToBookmark(row);
}

/**
 * Delete a bookmark by its ID.
 * Returns true if a row was deleted, false if the bookmark didn't exist.
 */
export function deleteBookmark(id: number): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM bookmarks WHERE id = @id")
    .run({ id });
  return result.changes > 0;
}

/**
 * Fetch a single bookmark by ID (used for ownership checks before deletion).
 */
export function getBookmarkById(id: number): Bookmark | null {
  const db = getDb();
  const row = db
    .prepare<{ id: number }, BookmarkRow>(
      "SELECT * FROM bookmarks WHERE id = @id"
    )
    .get({ id });
  return row ? rowToBookmark(row) : null;
}
