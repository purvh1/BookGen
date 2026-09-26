import { getDb } from "../index";
import type { User } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  displayName: string;
}

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  display_name: string | null;
  created_at: number;
}

// ─── Row → User mapper ────────────────────────────────────────────────────────

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name ?? "",
    passwordHash: row.password_hash,
    createdAt: new Date(row.created_at * 1000).toISOString(),
  };
}

// ─── Repository functions ─────────────────────────────────────────────────────

/**
 * Insert a new user. Throws if the email already exists (UNIQUE constraint).
 * Returns the created User (including passwordHash for internal use).
 */
export function createUser(input: CreateUserInput): User {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO users (email, password_hash, display_name)
    VALUES (@email, @passwordHash, @displayName)
  `);
  const result = stmt.run(input);
  const row = db
    .prepare<{ id: number }, UserRow>("SELECT * FROM users WHERE id = @id")
    .get({ id: result.lastInsertRowid as number });
  if (!row) throw new Error("Failed to retrieve newly created user");
  return rowToUser(row);
}

/**
 * Fetch a user by email. Returns null if not found.
 * Includes passwordHash (for login verification).
 */
export function getUserByEmail(email: string): User | null {
  const db = getDb();
  const row = db
    .prepare<{ email: string }, UserRow>(
      "SELECT * FROM users WHERE email = @email"
    )
    .get({ email });
  return row ? rowToUser(row) : null;
}

/**
 * Fetch a user by numeric ID. Returns null if not found.
 * Includes passwordHash (strip it in the API layer before responding).
 */
export function getUserById(id: number): User | null {
  const db = getDb();
  const row = db
    .prepare<{ id: number }, UserRow>("SELECT * FROM users WHERE id = @id")
    .get({ id });
  return row ? rowToUser(row) : null;
}
