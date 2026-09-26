import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { runMigrations } from "./schema";

// ─── Singleton DB instance ────────────────────────────────────────────────────

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath = process.env.DATABASE_PATH ?? "./db/bookgen.db";
  const resolvedPath = path.resolve(dbPath);

  // Ensure the directory exists before opening
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(resolvedPath);

  // Enable WAL for better concurrent read performance
  _db.pragma("journal_mode = WAL");
  // Enforce foreign key constraints
  _db.pragma("foreign_keys = ON");

  // Run schema migrations immediately on first open
  runMigrations(_db);

  return _db;
}
