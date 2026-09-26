import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import {
  getAnnotationById,
  deleteAnnotation,
} from "@/lib/db/repositories/annotations";

// Force dynamic rendering — this route reads the session cookie at request time
export const dynamic = "force-dynamic";

// ─── DELETE /api/annotations/[bookId]/[annotationId] ─────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookId: string; annotationId: string } }
) {
  let payload;
  try {
    payload = requireAuth(request);
  } catch (errorResponse) {
    return errorResponse as Response;
  }

  const annotationId = parseInt(params.annotationId, 10);
  if (isNaN(annotationId)) {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid annotation ID" },
      { status: 400 }
    );
  }

  const annotation = getAnnotationById(annotationId);

  if (!annotation) {
    return NextResponse.json(
      { error: "Not Found", message: "Annotation not found" },
      { status: 404 }
    );
  }

  if (annotation.userId !== payload.userId) {
    return NextResponse.json(
      { error: "Forbidden", message: "You do not own this annotation" },
      { status: 403 }
    );
  }

  deleteAnnotation(annotationId);

  return NextResponse.json({ message: "Annotation deleted" });
}
