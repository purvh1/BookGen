import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getBookmarkById, deleteBookmark } from "@/lib/db/repositories/bookmarks";

// Force dynamic rendering — this route reads the session cookie at request time
export const dynamic = "force-dynamic";

// ─── DELETE /api/bookmarks/[bookId]/[bookmarkId] ──────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookId: string; bookmarkId: string } }
) {
  let payload;
  try {
    payload = requireAuth(request);
  } catch (errorResponse) {
    return errorResponse as Response;
  }

  const bookmarkId = parseInt(params.bookmarkId, 10);
  if (isNaN(bookmarkId)) {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid bookmark ID" },
      { status: 400 }
    );
  }

  const bookmark = getBookmarkById(bookmarkId);

  if (!bookmark) {
    return NextResponse.json(
      { error: "Not Found", message: "Bookmark not found" },
      { status: 404 }
    );
  }

  if (bookmark.userId !== payload.userId) {
    return NextResponse.json(
      { error: "Forbidden", message: "You do not own this bookmark" },
      { status: 403 }
    );
  }

  deleteBookmark(bookmarkId);

  return NextResponse.json({ message: "Bookmark deleted" });
}
