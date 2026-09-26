"use client";

import Link from "next/link";
import type { Bookmark } from "@/types";

interface BookmarkPanelProps {
  bookId: string;
  bookmarks: Bookmark[];
  currentChapterId: number;
  onAddBookmark: () => void;
  onDelete: (id: number) => void;
}

export default function BookmarkPanel({
  bookId,
  bookmarks,
  currentChapterId,
  onAddBookmark,
  onDelete,
}: BookmarkPanelProps) {
  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/bookmarks/${bookId}/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete(id);
      }
    } catch (err) {
      console.error("Failed to delete bookmark:", err);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Add bookmark for current chapter */}
      <button
        onClick={onAddBookmark}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
        aria-label={`Bookmark chapter ${currentChapterId}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        Add Bookmark
      </button>

      {/* Bookmark list */}
      {bookmarks.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No bookmarks yet.
        </p>
      ) : (
        <ol className="space-y-2">
          {bookmarks
            .slice()
            .sort((a, b) => a.chapterId - b.chapterId)
            .map((bm) => (
              <li
                key={bm.id}
                className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 group"
              >
                <Link
                  href={`/read/${bookId}/${bm.chapterId}`}
                  className="flex-1 min-w-0"
                >
                  <span className="block text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                    Chapter {bm.chapterId}
                  </span>
                  {bm.label && (
                    <span className="block text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                      {bm.label}
                    </span>
                  )}
                  <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {new Date(bm.createdAt).toLocaleDateString()}
                  </span>
                </Link>
                <button
                  onClick={() => handleDelete(bm.id)}
                  aria-label={`Delete bookmark for chapter ${bm.chapterId}`}
                  className="p-1 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
        </ol>
      )}
    </div>
  );
}
