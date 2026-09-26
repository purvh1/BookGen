import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createUser } from "@/lib/db/repositories/users";

// ─── Input schema ─────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1).optional(),
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation Error",
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      },
      { status: 400 }
    );
  }

  const { email, password, displayName } = parsed.data;

  // Hash password with bcrypt (10 rounds)
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = createUser({
      email,
      passwordHash,
      displayName: displayName ?? "",
    });

    // Never return the password hash
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    // SQLite UNIQUE constraint violation on email
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("UNIQUE") || message.includes("unique")) {
      return NextResponse.json(
        { error: "Conflict", message: "An account with this email already exists" },
        { status: 409 }
      );
    }
    console.error("[register] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Registration failed" },
      { status: 500 }
    );
  }
}
