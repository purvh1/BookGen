import type Database from "better-sqlite3";

// ─── Schema Migrations ────────────────────────────────────────────────────────

const CREATE_BOOKS = `
CREATE TABLE IF NOT EXISTS books (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  author        TEXT NOT NULL,
  genre         TEXT NOT NULL,
  description   TEXT,
  cover_image   TEXT,
  language      TEXT DEFAULT 'en',
  published_year INTEGER,
  chapter_count INTEGER NOT NULL,
  file_path     TEXT NOT NULL,
  indexed_at    INTEGER NOT NULL
);
`;

const CREATE_USERS = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name  TEXT,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
`;

const CREATE_READING_PROGRESS = `
CREATE TABLE IF NOT EXISTS reading_progress (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id       TEXT    NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id    INTEGER NOT NULL,
  scroll_offset INTEGER DEFAULT 0,
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, book_id)
);
`;

const CREATE_BOOKMARKS = `
CREATE TABLE IF NOT EXISTS bookmarks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id    TEXT    NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id INTEGER NOT NULL,
  label      TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
`;

const CREATE_ANNOTATIONS = `
CREATE TABLE IF NOT EXISTS annotations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id       TEXT    NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id    INTEGER NOT NULL,
  start_offset  INTEGER NOT NULL,
  end_offset    INTEGER NOT NULL,
  selected_text TEXT    NOT NULL,
  note          TEXT,
  color         TEXT DEFAULT 'yellow',
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
`;

export function runMigrations(db: Database.Database): void {
  db.exec(CREATE_BOOKS);
  db.exec(CREATE_USERS);
  db.exec(CREATE_READING_PROGRESS);
  db.exec(CREATE_BOOKMARKS);
  db.exec(CREATE_ANNOTATIONS);
}
