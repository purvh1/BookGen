import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import { listAnnotations, addAnnotation } from "@/lib/db/repositories/annotations";

// Force dynamic rendering — this route reads the session cookie at request time
export const dynamic = "force-dynamic";

// ─── Zod schema for POST body ─────────────────────────────────────────────────

const postBodySchema = z
  .object({
    chapterId: z.number().int().positive(),
    startOffset: z.number().int().nonnegative(),
    endOffset: z.number().int(),
    selectedText: z.string().min(1),
    note: z.string().optional(),
    color: z
      .enum(["yellow", "green", "blue", "pink", "purple"])
      .default("yellow"),
  })
  .refine((data) => data.endOffset > data.startOffset, {
    message: "endOffset must be greater than startOffset",
    path: ["endOffset"],
  });

// ─── GET /api/annotations/[bookId] ───────────────────────────────────────────

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

  const annotations = listAnnotations(payload.userId, params.bookId);

  return NextResponse.json({ annotations });
}

// ─── POST /api/annotations/[bookId] ──────────────────────────────────────────

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

  const { chapterId, startOffset, endOffset, selectedText, note, color } =
    parsed.data;

  const annotation = addAnnotation({
    userId: payload.userId,
    bookId: params.bookId,
    chapterId,
    startOffset,
    endOffset,
    selectedText,
    note,
    color,
  });

  return NextResponse.json({ annotation }, { status: 201 });
}
