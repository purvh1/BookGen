"use client";

import Link from "next/link";

interface ChapterStub {
  id: number;
  title: string;
}

interface TableOfContentsProps {
  chapters: ChapterStub[];
  currentChapterId: number;
  bookId: string;
}

export default function TableOfContents({
  chapters,
  currentChapterId,
  bookId,
}: TableOfContentsProps) {
  return (
    <nav aria-label="Table of contents">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 px-2">
        Contents
      </h2>
      <ol className="space-y-0.5">
        {chapters.map((chapter) => {
          const isActive = chapter.id === currentChapterId;
          return (
            <li key={chapter.id}>
              <Link
                href={`/read/${bookId}/${chapter.id}`}
                className={`block px-2 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="text-xs text-gray-400 dark:text-gray-500 mr-1.5">
                  {chapter.id}.
                </span>
                {chapter.title}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
