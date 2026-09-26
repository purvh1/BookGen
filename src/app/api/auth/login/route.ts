import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getUserByEmail } from "@/lib/db/repositories/users";
import { signToken } from "@/lib/auth/jwt";

// ─── Input schema ─────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

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

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation Error",
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  // Fetch user by email
  const user = getUserByEmail(email);
  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Compare submitted password against stored hash
  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Sign JWT
  const token = signToken({ userId: user.id, email: user.email });

  // Build response and set httpOnly session cookie
  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
    },
  });

  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 60 * 60 * 24, // 24 hours in seconds
    path: "/",
  });

  return response;
}
