"use client";

import Link from "next/link";
import { useState } from "react";
import { descriptionIsValid, mapApiError } from "./utils";

type Status = "idle" | "loading" | "success" | "error";

interface BookRecord {
  id: string;
  title: string;
}

interface SuccessCardProps {
  book: BookRecord;
  onReset: () => void;
}

function SuccessCard({ book, onReset }: SuccessCardProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 text-center bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
      {/* Green checkmark icon */}
      <span className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">
          Your book is ready!
        </p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {book.title}
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Link
          href={`/read/${book.id}/1`}
          aria-label={`Read ${book.title} now`}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          Read Now →
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          Generate another
        </button>
      </div>
    </div>
  );
}

export default function GenerateForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [book, setBook] = useState<BookRecord | null>(null);

  function handleReset() {
    setStatus("idle");
    setDescription("");
    setErrorMessage(null);
    setBook(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/generate/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (res.ok) {
        setBook(data.book);
        setStatus("success");
      } else {
        setErrorMessage(mapApiError(res.status, data));
        setStatus("error");
      }
    } catch {
      setErrorMessage(mapApiError(500, {}));
      setStatus("error");
    }
  }

  if (status === "success" && book) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
        <SuccessCard book={book} onReset={handleReset} />
      </div>
    );
  }

  const isLoading = status === "loading";
  const canSubmit = descriptionIsValid(description) && !isLoading;

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Label + Textarea */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="description"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Book Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            placeholder="Describe the book you want to generate… (at least 20 characters)"
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          />
          {/* Character counter */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
            {description.length} / 20 chars minimum
          </p>
        </div>

        {/* Inline error */}
        {status === "error" && errorMessage && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3"
          >
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!canSubmit}
          aria-busy={isLoading ? "true" : undefined}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              {/* Spinner SVG */}
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating your book… This can take a minute or two.
            </>
          ) : (
            "Generate Book"
          )}
        </button>
      </form>
    </div>
  );
}
