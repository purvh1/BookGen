import { getDb } from "../index";
import type { Annotation, AnnotationColor } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddAnnotationInput {
  userId: number;
  bookId: string;
  chapterId: number;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  note?: string;
  color?: AnnotationColor;
}

interface AnnotationRow {
  id: number;
  user_id: number;
  book_id: string;
  chapter_id: number;
  start_offset: number;
  end_offset: number;
  selected_text: string;
  note: string | null;
  color: string;
  created_at: number;
}

// ─── Row → Annotation mapper ──────────────────────────────────────────────────

function rowToAnnotation(row: AnnotationRow): Annotation {
  return {
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    chapterId: row.chapter_id,
    startOffset: row.start_offset,
    endOffset: row.end_offset,
    selectedText: row.selected_text,
    note: row.note ?? undefined,
    color: row.color as AnnotationColor,
    createdAt: new Date(row.created_at * 1000).toISOString(),
  };
}

// ─── Repository functions ─────────────────────────────────────────────────────

/**
 * List all annotations for a user on a specific book, ordered by chapter and offset.
 */
export function listAnnotations(userId: number, bookId: string): Annotation[] {
  const db = getDb();
  const rows = db
    .prepare<{ userId: number; bookId: string }, AnnotationRow>(
      `SELECT * FROM annotations
       WHERE user_id = @userId AND book_id = @bookId
       ORDER BY chapter_id ASC, start_offset ASC`
    )
    .all({ userId, bookId });
  return rows.map(rowToAnnotation);
}

/**
 * Add a new annotation (highlight + optional note). Returns the created Annotation.
 */
export function addAnnotation(input: AddAnnotationInput): Annotation {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO annotations
         (user_id, book_id, chapter_id, start_offset, end_offset, selected_text, note, color)
       VALUES
         (@userId, @bookId, @chapterId, @startOffset, @endOffset, @selectedText, @note, @color)`
    )
    .run({
      userId: input.userId,
      bookId: input.bookId,
      chapterId: input.chapterId,
      startOffset: input.startOffset,
      endOffset: input.endOffset,
      selectedText: input.selectedText,
      note: input.note ?? null,
      color: input.color ?? "yellow",
    });

  const row = db
    .prepare<{ id: number }, AnnotationRow>(
      "SELECT * FROM annotations WHERE id = @id"
    )
    .get({ id: result.lastInsertRowid as number });

  if (!row) throw new Error("Failed to retrieve newly created annotation");
  return rowToAnnotation(row);
}

/**
 * Delete an annotation by its ID.
 * Returns true if a row was deleted, false if the annotation didn't exist.
 */
export function deleteAnnotation(id: number): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM annotations WHERE id = @id")
    .run({ id });
  return result.changes > 0;
}

/**
 * Fetch a single annotation by ID (used for ownership checks before deletion).
 */
export function getAnnotationById(id: number): Annotation | null {
  const db = getDb();
  const row = db
    .prepare<{ id: number }, AnnotationRow>(
      "SELECT * FROM annotations WHERE id = @id"
    )
    .get({ id });
  return row ? rowToAnnotation(row) : null;
}
