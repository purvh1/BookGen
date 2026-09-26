import fs from "fs";
import path from "path";
import { BookSchema } from "./schema";
import { upsertBook } from "@/lib/db/repositories/books";

// ─── Loader ───────────────────────────────────────────────────────────────────

/**
 * Scans the books data directory, validates each JSON file against the
 * BookSchema, and upserts valid entries into the SQLite `books` table.
 *
 * Invalid files are logged as warnings and skipped — they do not cause the
 * server to fail to start.
 */
export function loadBooks(): void {
  const dataDir = process.env.BOOKS_DATA_DIR ?? "./data/books";
  const resolvedDir = path.resolve(dataDir);

  if (!fs.existsSync(resolvedDir)) {
    console.warn(
      `[books/loader] Books data directory not found: ${resolvedDir}`
    );
    return;
  }

  let files: string[];
  try {
    files = fs
      .readdirSync(resolvedDir)
      .filter((f) => f.endsWith(".json"));
  } catch (err) {
    console.error(`[books/loader] Failed to read directory ${resolvedDir}:`, err);
    return;
  }

  if (files.length === 0) {
    console.info(`[books/loader] No JSON files found in ${resolvedDir}`);
    return;
  }

  let loaded = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(resolvedDir, file);

    // Parse JSON
    let raw: unknown;
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      raw = JSON.parse(content);
    } catch (err) {
      console.warn(`[books/loader] Skipping ${file}: failed to read/parse JSON —`, err);
      skipped++;
      continue;
    }

    // Validate against Zod schema (REQ-2.1, REQ-2.2)
    const result = BookSchema.safeParse(raw);
    if (!result.success) {
      console.warn(
        `[books/loader] Skipping ${file}: schema validation failed —`,
        result.error.flatten()
      );
      skipped++;
      continue;
    }

    const book = result.data;

    // Upsert into the books table
    try {
      upsertBook({
        id: book.id,
        title: book.title,
        author: book.author,
        genre: book.genre,
        description: book.description,
        coverImage: book.coverImage,
        language: book.language,
        publishedYear: book.publishedYear,
        chapterCount: book.chapters.length,
        filePath: path.resolve(filePath), // store absolute path
      });
      loaded++;
    } catch (err) {
      console.error(`[books/loader] Failed to upsert book from ${file}:`, err);
      skipped++;
    }
  }

  console.info(
    `[books/loader] Done — ${loaded} book(s) loaded, ${skipped} skipped.`
  );
}
