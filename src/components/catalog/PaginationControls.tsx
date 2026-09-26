"use client";

import Link from "next/link";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  currentParams: Record<string, string>;
}

function buildHref(
  basePath: string,
  params: Record<string, string>,
  page: number
): string {
  const searchParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) searchParams.set(k, v);
  }
  searchParams.set("page", String(page));
  return `${basePath}?${searchParams.toString()}`;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  basePath,
  currentParams,
}: PaginationControlsProps) {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Generate page numbers to show (window of 5 around current page)
  const pages: (number | "…")[] = [];
  const window = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - window && i <= currentPage + window)
    ) {
      pages.push(i);
    } else if (
      pages[pages.length - 1] !== "…"
    ) {
      pages.push("…");
    }
  }

  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      {/* Prev */}
      {hasPrev ? (
        <Link
          href={buildHref(basePath, currentParams, currentPage - 1)}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          aria-label="Previous page"
        >
          ← Prev
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed">
          ← Prev
        </span>
      )}

      {/* Page numbers */}
      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(basePath, currentParams, p)}
            className={`w-9 h-9 flex items-center justify-center text-sm rounded-md border transition-colors ${
              p === currentPage
                ? "bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500"
                : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {hasNext ? (
        <Link
          href={buildHref(basePath, currentParams, currentPage + 1)}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          aria-label="Next page"
        >
          Next →
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed">
          Next →
        </span>
      )}
    </nav>
  );
}
