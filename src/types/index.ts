// ─── Book & Content Types ────────────────────────────────────────────────────

export interface Chapter {
  id: number;
  title: string;
  content: string;
}

/** Lightweight chapter stub returned in book metadata (no content) */
export interface ChapterStub {
  id: number;
  title: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string[];
  description: string;
  coverImage: string;
  language: string;
  publishedYear: number;
  chapters: Chapter[];
}

/** Book row as stored in the SQLite `books` table */
export interface BookRecord {
  id: string;
  title: string;
  author: string;
  /** JSON-serialised string[] */
  genre: string;
  description: string;
  coverImage: string;
  language: string;
  publishedYear: number;
  chapterCount: number;
  sourcePath: string;
  createdAt: string;
  updatedAt: string;
}

// ─── User Types ──────────────────────────────────────────────────────────────

export interface User {
  id: number;
  displayName: string;
  email: string;
  /** Never returned to the client */
  passwordHash?: string;
  createdAt: string;
}

/** Public-facing user object (no password hash) */
export type PublicUser = Omit<User, "passwordHash">;

// ─── Reading Progress Types ───────────────────────────────────────────────────

export interface ReadingProgress {
  id: number;
  userId: number;
  bookId: string;
  chapterId: number;
  scrollOffset: number;
  updatedAt: string;
}

// ─── Bookmark Types ───────────────────────────────────────────────────────────

export interface Bookmark {
  id: number;
  userId: number;
  bookId: string;
  chapterId: number;
  /** Optional human-readable label */
  label?: string;
  createdAt: string;
}

// ─── Annotation Types ─────────────────────────────────────────────────────────

export type AnnotationColor = "yellow" | "green" | "blue" | "pink" | "purple";

export interface Annotation {
  id: number;
  userId: number;
  bookId: string;
  chapterId: number;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  /** Optional note attached to the highlight */
  note?: string;
  color: AnnotationColor;
  createdAt: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  error: string;
  message?: string;
}
