"use client";

import Image from "next/image";
import Link from "next/link";
import ProgressBar from "@/components/ui/ProgressBar";

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
  coverImage,
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
      {/* Cover image */}
      <div className="relative w-full bg-gray-100 dark:bg-gray-700 flex-shrink-0" style={{ aspectRatio: "200/280" }}>
        {coverImage ? (
          <Image
            src={coverImage}
            alt={`Cover of ${title}`}
            width={200}
            height={280}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        )}
      </div>

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
