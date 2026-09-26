import { NextResponse } from "next/server";

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });

  // Clear the session cookie by setting maxAge to 0
  response.cookies.set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  return response;
}
