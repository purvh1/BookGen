import fs from "node:fs";
import path from "node:path";
import type { BookJson } from "@/lib/books/schema";
import { BookSchema } from "@/lib/books/schema";
import { upsertBook } from "@/lib/db/repositories/books";
import type { BedrockProvider } from "./bedrock";
import { extractJsonBlock, slugify } from "./utils";

// ─── Errors ───────────────────────────────────────────────────────────────────

export class BookAlreadyExistsError extends Error {
  constructor(id: string) {
    super(`Book already exists: ${id}`);
    this.name = "BookAlreadyExistsError";
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GenerateBookInput {
  description: string;
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildIndexPrompt(description: string): string {
  return `You are a professional author. Based on the following description, produce a book index as a JSON object inside \`\`\`json ... \`\`\` fences.

Description: ${description}

The JSON must conform to this TypeScript type:
{
  id: string,          // URL-safe slug derived from title
  title: string,
  author: string,
  genre: string[],
  description: string,
  coverImage: string,  // leave ""
  language: string,    // e.g. "en"
  publishedYear: number,
  chapters: Array<{ id: number, title: string }>  // 5-12 chapters, no content
}
Return ONLY the JSON block, no other text.`;
}

function buildChapterPrompt(
  chapterId: number,
  chapterTitle: string,
  bookTitle: string,
  author: string,
  bookDescription: string,
  allChapterTitles: Array<{ id: number; title: string }>
): string {
  const chapterList = allChapterTitles
    .map((ch) => `${ch.id}. ${ch.title}`)
    .join("\n");

  return `You are writing chapter ${chapterId}: "${chapterTitle}" of the book "${bookTitle}" by ${author}.

Book synopsis: ${bookDescription}

Full chapter list:
${chapterList}

Write the complete content for this chapter. Aim for 800-1500 words. Return only the chapter text, no JSON, no headings, no "Chapter X:" prefix.`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class BookGeneratorService {
  constructor(private readonly provider: BedrockProvider) {}

  async generate(input: GenerateBookInput): Promise<BookJson> {
    const { description } = input;

    // ── Phase 1: Generate the book index ─────────────────────────────────────
    const indexPrompt = buildIndexPrompt(description);
    const indexRaw = await this.provider.invoke(indexPrompt);
    const indexData = extractJsonBlock(indexRaw) as Record<string, unknown> | null;

    if (!indexData || typeof indexData !== "object") {
      throw new Error("Failed to parse book index from LLM response");
    }

    // Derive the id from the title as a URL-safe slug; blank out the cover image
    const title = typeof indexData.title === "string" ? indexData.title : "";
    const id = slugify(title);
    indexData.id = id;
    indexData.coverImage = "";

    // ── Idempotency check (after getting the id, before chapter calls) ────────
    const booksDataDir = process.env.BOOKS_DATA_DIR ?? "./data/books";
    const outputPath = path.resolve(booksDataDir, `${id}.json`);

    if (fs.existsSync(outputPath)) {
      throw new BookAlreadyExistsError(id);
    }

    // ── Phase 2: Generate each chapter sequentially ──────────────────────────
    const chapterStubs = Array.isArray(indexData.chapters)
      ? (indexData.chapters as Array<{ id: number; title: string }>)
      : [];

    const chaptersWithContent: Array<{ id: number; title: string; content: string }> = [];

    for (const stub of chapterStubs) {
      const chapterPrompt = buildChapterPrompt(
        stub.id,
        stub.title,
        title,
        typeof indexData.author === "string" ? indexData.author : "",
        typeof indexData.description === "string" ? indexData.description : description,
        chapterStubs
      );

      const chapterContent = await this.provider.invoke(chapterPrompt);
      chaptersWithContent.push({
        id: stub.id,
        title: stub.title,
        content: chapterContent.trim(),
      });
    }

    // ── Assemble the full book object ─────────────────────────────────────────
    const assembled = {
      ...indexData,
      chapters: chaptersWithContent,
    };

    // ── Schema validation ─────────────────────────────────────────────────────
    const parsed = BookSchema.safeParse(assembled);
    if (!parsed.success) {
      throw new Error(
        `Book failed schema validation: ${parsed.error.message}`
      );
    }

    const book: BookJson = parsed.data;

    // ── Persist to disk ───────────────────────────────────────────────────────
    fs.writeFileSync(outputPath, JSON.stringify(book, null, 2));

    // ── Register in SQLite catalog ────────────────────────────────────────────
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
      filePath: outputPath,
    });

    return book;
  }
}
