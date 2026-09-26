import { z } from "zod";

// ─── Chapter schema ───────────────────────────────────────────────────────────

export const ChapterSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  content: z.string().min(1),
});

// ─── Book schema ──────────────────────────────────────────────────────────────

export const BookSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  genre: z.array(z.string().min(1)),
  description: z.string(),
  coverImage: z.string(),
  language: z.string().min(1),
  publishedYear: z.number().int(),
  chapters: z.array(ChapterSchema).min(1, {
    message: "Book must contain at least one chapter",
  }),
});

export type BookJson = z.infer<typeof BookSchema>;
export type ChapterJson = z.infer<typeof ChapterSchema>;
