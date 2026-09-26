"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";

export type FontSize = "small" | "medium" | "large";

const FONT_SIZE_KEY = "readerFontSize";

interface ReaderControlsProps {
  onFontSizeChange?: (size: FontSize) => void;
}

export default function ReaderControls({ onFontSizeChange }: ReaderControlsProps) {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>("medium");

  // Load persisted font size on mount
  useEffect(() => {
    const stored = localStorage.getItem(FONT_SIZE_KEY) as FontSize | null;
    if (stored === "small" || stored === "medium" || stored === "large") {
      setFontSize(stored);
    }
  }, []);

  function handleFontSizeChange(size: FontSize) {
    setFontSize(size);
    localStorage.setItem(FONT_SIZE_KEY, size);
    onFontSizeChange?.(size);
  }

  const fontSizeOptions: { value: FontSize; label: string; sampleClass: string }[] = [
    { value: "small", label: "Small", sampleClass: "text-sm" },
    { value: "medium", label: "Medium", sampleClass: "text-base" },
    { value: "large", label: "Large", sampleClass: "text-lg" },
  ];

  return (
    <div className="relative">
      {/* Gear icon button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Reader settings"
        aria-expanded={isOpen}
        className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Settings panel */}
      {isOpen && (
        <>
          {/* Backdrop to close panel */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-10 z-20 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
            {/* Font size selector */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Font Size
              </p>
              <div className="flex gap-2">
                {fontSizeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleFontSizeChange(opt.value)}
                    aria-pressed={fontSize === opt.value}
                    className={`flex-1 py-1.5 rounded-md text-center transition-colors ${opt.sampleClass} ${
                      fontSize === opt.value
                        ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    A
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                {fontSizeOptions.map((opt) => (
                  <span
                    key={opt.value}
                    className="flex-1 text-center text-xs text-gray-400 dark:text-gray-500"
                  >
                    {opt.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Theme toggle */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Theme
              </p>
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
                {theme === "dark" ? (
                  /* Sun */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07-.71.71M6.34 17.66l-.71.71M17.66 17.66l.71.71M6.34 6.34l.71.71M12 5a7 7 0 100 14A7 7 0 0012 5z" />
                  </svg>
                ) : (
                  /* Moon */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
