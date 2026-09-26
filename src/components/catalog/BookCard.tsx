"use client";

import Link from "next/link";
import ProgressBar from "@/components/ui/ProgressBar";
import BookCover from "./BookCover";

export interface BookCardProps {
  id: string;
  title: string;
  author: string;
  genre: string[];
  description: string;
  coverImage: string;
  chapterCount: number;
  progress?: {
    chapterId: number;
  };
}

export default function BookCard({
  id,
  title,
  author,
  genre,
  description,
  chapterCount,
  progress,
}: BookCardProps) {
  const targetChapter = progress?.chapterId ?? 1;
  const readHref = `/read/${id}/${targetChapter}`;
  const ctaLabel = progress ? "Continue Reading" : "Read";

  // Progress as a percentage of chapters read
  const progressPercent =
    progress && chapterCount > 0
      ? Math.round(((progress.chapterId - 1) / chapterCount) * 100)
      : 0;

  return (
    <article className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700">
      {/* Cover */}
      <BookCover
        title={title}
        author={author}
        genre={genre}
        className="w-full"
      />

      {/* Card body */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {/* Title & author */}
        <div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
            {title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{author}</p>
        </div>

        {/* Genre badges */}
        {genre.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {genre.slice(0, 2).map((g) => (
              <span
                key={g}
                className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 flex-1">
          {description}
        </p>

        {/* Progress bar (authenticated users) */}
        {progress && (
          <div className="mt-1">
            <ProgressBar value={progressPercent} />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Chapter {progress.chapterId} of {chapterCount}
            </p>
          </div>
        )}

        {/* CTA button */}
        <Link
          href={readHref}
          className="mt-auto text-center text-xs font-medium bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-1.5 px-3 rounded-lg transition-colors"
        >
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}
