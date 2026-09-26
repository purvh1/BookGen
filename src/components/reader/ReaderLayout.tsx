"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Annotation, Bookmark } from "@/types";
import TableOfContents from "./TableOfContents";
import ChapterContent from "./ChapterContent";
import ReaderControls from "./ReaderControls";
import BookmarkPanel from "./BookmarkPanel";
import AnnotationPanel from "./AnnotationPanel";

interface ChapterStub {
  id: number;
  title: string;
}

interface ChapterData {
  id: number;
  title: string;
  content: string;
}

interface ReaderLayoutProps {
  bookId: string;
  bookTitle: string;
  chapters: ChapterStub[];
  currentChapterId: number;
  chapter: ChapterData;
}

type PanelTab = "toc" | "bookmarks" | "annotations";

export default function ReaderLayout({
  bookId,
  bookTitle,
  chapters,
  currentChapterId,
  chapter,
}: ReaderLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<PanelTab>("toc");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Track scroll offset for progress saving
  const scrollOffsetRef = useRef(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Determine previous / next chapter ids
  const currentIndex = chapters.findIndex((c) => c.id === currentChapterId);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  // Check auth & load bookmarks/annotations on mount
  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch("/api/me");
        if (!meRes.ok) return;
        setIsAuthenticated(true);

        const [bmRes, annRes] = await Promise.all([
          fetch(`/api/bookmarks/${bookId}`),
          fetch(`/api/annotations/${bookId}`),
        ]);

        if (bmRes.ok) {
          const bmData = (await bmRes.json()) as { bookmarks: Bookmark[] };
          setBookmarks(bmData.bookmarks ?? []);
        }
        if (annRes.ok) {
          const annData = (await annRes.json()) as { annotations: Annotation[] };
          setAnnotations(annData.annotations ?? []);
        }
      } catch {
        // Not authenticated or network error — silent
      }
    }
    void init();
  }, [bookId]);

  // Track scroll offset
  useEffect(() => {
    function onScroll() {
      scrollOffsetRef.current = Math.round(window.scrollY);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-save progress every 10 seconds (REQ-3.7)
  useEffect(() => {
    if (!isAuthenticated) return;

    async function saveProgress() {
      try {
        await fetch(`/api/progress/${bookId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapterId: currentChapterId,
            scrollOffset: scrollOffsetRef.current,
          }),
        });
      } catch {
        // Silent — best-effort save
      }
    }

    // Save immediately on mount, then every 10 seconds
    void saveProgress();
    progressTimerRef.current = setInterval(saveProgress, 10_000);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [bookId, currentChapterId, isAuthenticated]);

  async function handleAddBookmark() {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`/api/bookmarks/${bookId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: currentChapterId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { bookmark: Bookmark };
        setBookmarks((prev) => {
          // Avoid duplicate bookmarks for the same chapter
          const exists = prev.some((b) => b.id === data.bookmark.id);
          return exists ? prev : [...prev, data.bookmark];
        });
        setActiveTab("bookmarks");
      }
    } catch (err) {
      console.error("Failed to add bookmark:", err);
    }
  }

  function handleAnnotationCreate(annotation: Annotation) {
    setAnnotations((prev) => [...prev, annotation]);
  }

  function handleDeleteBookmark(id: number) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  function handleDeleteAnnotation(id: number) {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }

  function handleChapterNav(chapterId: number) {
    router.push(`/read/${bookId}/${chapterId}`);
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={`flex flex-col flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 overflow-hidden ${
          sidebarOpen ? "w-64" : "w-0"
        }`}
        aria-label="Reader sidebar"
      >
        <div className="flex-1 overflow-y-auto p-4 min-w-[16rem]">
          {/* Panel tabs */}
          <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            {(["toc", "bookmarks", "annotations"] as PanelTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 text-xs font-medium py-1 rounded-md transition-colors capitalize ${
                  activeTab === tab
                    ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {tab === "toc" ? "Contents" : tab}
              </button>
            ))}
          </div>

          {activeTab === "toc" && (
            <TableOfContents
              chapters={chapters}
              currentChapterId={currentChapterId}
              bookId={bookId}
            />
          )}
          {activeTab === "bookmarks" && (
            <BookmarkPanel
              bookId={bookId}
              bookmarks={bookmarks}
              currentChapterId={currentChapterId}
              onAddBookmark={handleAddBookmark}
              onDelete={handleDeleteBookmark}
            />
          )}
          {activeTab === "annotations" && (
            <AnnotationPanel
              bookId={bookId}
              annotations={annotations}
              onDelete={handleDeleteAnnotation}
            />
          )}
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Reader toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Toggle sidebar */}
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>

            {/* Book title / breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Link
                href={`/catalog`}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Catalog
              </Link>
              <span>/</span>
              <span className="text-gray-700 dark:text-gray-200 font-medium truncate max-w-[200px] sm:max-w-xs">
                {bookTitle}
              </span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {isAuthenticated && (
              <button
                onClick={handleAddBookmark}
                aria-label="Bookmark this chapter"
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            )}
            <ReaderControls />
          </div>
        </div>

        {/* Scrollable chapter area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8">
            <ChapterContent
              bookId={bookId}
              chapter={chapter}
              annotations={annotations.filter(
                (a) => a.chapterId === currentChapterId
              )}
              onAnnotationCreate={handleAnnotationCreate}
            />

            {/* Chapter navigation */}
            <nav
              aria-label="Chapter navigation"
              className="flex items-center justify-between mt-12 pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              {prevChapter ? (
                <button
                  onClick={() => handleChapterNav(prevChapter.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:block truncate max-w-[160px]">
                    {prevChapter.title}
                  </span>
                  <span className="sm:hidden">Previous</span>
                </button>
              ) : (
                <div />
              )}

              <span className="text-xs text-gray-400 dark:text-gray-500">
                {currentIndex + 1} / {chapters.length}
              </span>

              {nextChapter ? (
                <button
                  onClick={() => handleChapterNav(nextChapter.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="hidden sm:block truncate max-w-[160px]">
                    {nextChapter.title}
                  </span>
                  <span className="sm:hidden">Next</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <div />
              )}
            </nav>
          </div>
        </main>
      </div>
    </div>
  );
}
