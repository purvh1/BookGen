"use client";

import type { Annotation } from "@/types";

interface AnnotationPanelProps {
  bookId: string;
  annotations: Annotation[];
  onDelete: (id: number) => void;
}

const colorDotClass: Record<string, string> = {
  yellow: "bg-yellow-400",
  green: "bg-green-400",
  blue: "bg-blue-400",
  pink: "bg-pink-400",
  purple: "bg-purple-400",
};

export default function AnnotationPanel({
  bookId,
  annotations,
  onDelete,
}: AnnotationPanelProps) {
  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/annotations/${bookId}/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete(id);
      }
    } catch (err) {
      console.error("Failed to delete annotation:", err);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {annotations.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No annotations yet. Select text to highlight.
        </p>
      ) : (
        <ol className="space-y-2">
          {annotations.map((ann) => (
            <li
              key={ann.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 group"
            >
              <span
                className={`mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full ${colorDotClass[ann.color] ?? "bg-yellow-400"}`}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 italic">
                  &ldquo;{ann.selectedText}&rdquo;
                </p>
                {ann.note && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {ann.note}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Ch. {ann.chapterId} &middot;{" "}
                  {new Date(ann.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(ann.id)}
                aria-label="Delete annotation"
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
