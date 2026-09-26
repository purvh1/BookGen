import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getUserById } from "@/lib/db/repositories/users";

// Force dynamic rendering — this route reads the session cookie at request time
export const dynamic = "force-dynamic";

// ─── GET /api/me ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  let payload;
  try {
    payload = requireAuth(request);
  } catch (errorResponse) {
    // requireAuth throws a Response on auth failure — return it directly
    return errorResponse as Response;
  }

  const user = getUserById(payload.userId);
  if (!user) {
    return NextResponse.json(
      { error: "Not Found", message: "User not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
    },
  });
}
