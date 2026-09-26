import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import { getProgress, upsertProgress } from "@/lib/db/repositories/progress";

// Force dynamic rendering — this route reads the session cookie at request time
export const dynamic = "force-dynamic";

// ─── Zod schema for PUT body ──────────────────────────────────────────────────

const putBodySchema = z.object({
  chapterId: z.number().int().positive(),
  scrollOffset: z.number().int().nonnegative().optional(),
});

// ─── GET /api/progress/[bookId] ───────────────────────────────────────────────

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

  const progress = getProgress(payload.userId, params.bookId);

  // Return null progress (not a 404) so clients can detect "no progress yet"
  return NextResponse.json({ progress: progress ?? null });
}

// ─── PUT /api/progress/[bookId] ───────────────────────────────────────────────

export async function PUT(
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

  const parsed = putBodySchema.safeParse(body);
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

  const { chapterId, scrollOffset } = parsed.data;

  const progress = upsertProgress({
    userId: payload.userId,
    bookId: params.bookId,
    chapterId,
    scrollOffset,
  });

  return NextResponse.json({ progress });
}
