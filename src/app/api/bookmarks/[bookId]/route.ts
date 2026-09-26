import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import { listBookmarks, addBookmark } from "@/lib/db/repositories/bookmarks";

// Force dynamic rendering — this route reads the session cookie at request time
export const dynamic = "force-dynamic";

// ─── Zod schema for POST body ─────────────────────────────────────────────────

const postBodySchema = z.object({
  chapterId: z.number().int().positive(),
  label: z.string().optional(),
});

// ─── GET /api/bookmarks/[bookId] ──────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  let payload;
  try {
    payload = requireAuth(request);
  } catch (errorResponse) {
    return errorResponse as Response;
  }

  const bookmarks = listBookmarks(payload.userId, params.bookId);

  return NextResponse.json({ bookmarks });
}

// ─── POST /api/bookmarks/[bookId] ─────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  let payload;
  try {
    payload = requireAuth(request);
  } catch (errorResponse) {
    return errorResponse as Response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = postBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Bad Request",
        message: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { chapterId, label } = parsed.data;

  const bookmark = addBookmark({
    userId: payload.userId,
    bookId: params.bookId,
    chapterId,
    label,
  });

  return NextResponse.json({ bookmark }, { status: 201 });
}
