/**
 * Property-based tests for BookSchema round-trips.
 *
 * Validates: Requirements REQ-4.4
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { BookSchema } from "@/lib/books/schema";

// ─── Arbitrary for a valid chapter ───────────────────────────────────────────

const chapterArbitrary = fc.record({
  id: fc.integer({ min: 1 }),
  title: fc.string({ minLength: 1 }),
  content: fc.string({ minLength: 1 }),
});

// ─── Arbitrary for a valid BookJson ──────────────────────────────────────────

const validBookArbitrary = fc.record({
  id: fc.stringMatching(/^[a-z][a-z0-9-]*[a-z0-9]$/).filter((s) => s.length >= 2),
  title: fc.string({ minLength: 1 }),
  author: fc.string({ minLength: 1 }),
  genre: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
  description: fc.string(),
  coverImage: fc.string(),
  language: fc.string({ minLength: 1 }),
  publishedYear: fc.integer(),
  chapters: fc.array(chapterArbitrary, { minLength: 1 }),
});

// ─── Properties ──────────────────────────────────────────────────────────────

describe("BookSchema", () => {
  it("valid arbitrary book always passes safeParse", () => {
    fc.assert(
      fc.property(validBookArbitrary, (book) => {
        const result = BookSchema.safeParse(book);
        expect(result.success).toBe(true);
      })
    );
  });

  it("blank title always fails safeParse", () => {
    fc.assert(
      fc.property(validBookArbitrary, (book) => {
        const invalid = { ...book, title: "" };
        const result = BookSchema.safeParse(invalid);
        expect(result.success).toBe(false);
      })
    );
  });

  it("empty chapters array always fails safeParse", () => {
    fc.assert(
      fc.property(validBookArbitrary, (book) => {
        const invalid = { ...book, chapters: [] };
        const result = BookSchema.safeParse(invalid);
        expect(result.success).toBe(false);
      })
    );
  });

  it("chapter with non-positive id always fails safeParse", () => {
    fc.assert(
      fc.property(validBookArbitrary, fc.integer({ max: 0 }), (book, badId) => {
        const badChapter = { id: badId, title: "A Chapter", content: "Some content" };
        const invalid = { ...book, chapters: [badChapter] };
        const result = BookSchema.safeParse(invalid);
        expect(result.success).toBe(false);
      })
    );
  });

  it("chapter with blank title always fails safeParse", () => {
    fc.assert(
      fc.property(validBookArbitrary, (book) => {
        const badChapter = { id: 1, title: "", content: "Some content" };
        const invalid = { ...book, chapters: [badChapter] };
        const result = BookSchema.safeParse(invalid);
        expect(result.success).toBe(false);
      })
    );
  });
});
