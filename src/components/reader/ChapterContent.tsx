"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Annotation, AnnotationColor } from "@/types";

type FontSize = "small" | "medium" | "large";

interface ChapterData {
  id: number;
  title: string;
  content: string;
}

interface SelectionTooltip {
  x: number;
  y: number;
  text: string;
}

interface ChapterContentProps {
  bookId: string;
  chapter: ChapterData;
  annotations: Annotation[];
  onAnnotationCreate: (annotation: Annotation) => void;
}

const FONT_SIZE_KEY = "readerFontSize";

const fontSizeClass: Record<FontSize, string> = {
  small: "text-sm leading-relaxed",
  medium: "text-base leading-relaxed",
  large: "text-lg leading-loose",
};

const annotationColorStyle: Record<AnnotationColor, string> = {
  yellow: "background-color: rgba(253, 224, 71, 0.4);",
  green: "background-color: rgba(134, 239, 172, 0.4);",
  blue: "background-color: rgba(147, 197, 253, 0.4);",
  pink: "background-color: rgba(249, 168, 212, 0.4);",
  purple: "background-color: rgba(196, 181, 253, 0.4);",
};

/**
 * Apply annotation highlights to the article element by walking text nodes
 * and wrapping matched character ranges in <mark> elements.
 */
function applyHighlights(container: HTMLElement, annotations: Annotation[]) {
  if (!annotations.length) return;

  // Collect all text nodes in document order
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  // Build a flat map: absolute character offset → [textNode, localOffset]
  let globalOffset = 0;
  const nodeMap: Array<{ node: Text; start: number; end: number }> = textNodes.map((tn) => {
    const start = globalOffset;
    globalOffset += tn.length;
    return { node: tn, start, end: globalOffset };
  });

  // Sort annotations by start offset descending so DOM mutations don't shift offsets
  const sorted = [...annotations].sort((a, b) => b.startOffset - a.startOffset);

  for (const ann of sorted) {
    const { startOffset, endOffset, color, selectedText } = ann;
    if (startOffset >= endOffset) continue;

    // Find the text node(s) that span [startOffset, endOffset)
    const startEntry = nodeMap.find(
      (e) => e.start <= startOffset && startOffset < e.end
    );
    const endEntry = nodeMap.find(
      (e) => e.start < endOffset && endOffset <= e.end
    );
    if (!startEntry || !endEntry) continue;

    // Only handle single-node spans to keep implementation safe
    if (startEntry.node !== endEntry.node) continue;

    const textNode = startEntry.node;
    const localStart = startOffset - startEntry.start;
    const localEnd = endOffset - startEntry.start;

    // Validate the text matches what was stored (use textContent semantics)
    const slice = textNode.textContent?.slice(localStart, localEnd) ?? "";
    if (slice !== selectedText) continue;

    const mark = document.createElement("mark");
    mark.setAttribute("data-annotation-id", String(ann.id));
    mark.setAttribute("style", annotationColorStyle[color] ?? annotationColorStyle.yellow);
    mark.className = "rounded-sm cursor-pointer";

    // Split and wrap
    const after = textNode.splitText(localEnd);
    const highlighted = textNode.splitText(localStart);
    // `highlighted` now contains the target text, `after` has the rest
    textNode.parentNode?.insertBefore(mark, highlighted);
    mark.appendChild(highlighted);
    // Restore `after` reference (splitText already positioned it correctly)
    void after; // suppress unused warning — it stays in the DOM automatically
  }
}

export default function ChapterContent({
  bookId,
  chapter,
  annotations,
  onAnnotationCreate,
}: ChapterContentProps) {
  const articleRef = useRef<HTMLElement>(null);
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [tooltip, setTooltip] = useState<SelectionTooltip | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Load persisted font size
  useEffect(() => {
    const stored = localStorage.getItem(FONT_SIZE_KEY) as FontSize | null;
    if (stored === "small" || stored === "medium" || stored === "large") {
      setFontSize(stored);
    }

    // Listen for storage changes from ReaderControls
    function onStorage(e: StorageEvent) {
      if (e.key === FONT_SIZE_KEY && e.newValue) {
        const v = e.newValue as FontSize;
        if (v === "small" || v === "medium" || v === "large") {
          setFontSize(v);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Apply stored highlights on mount / when annotations change
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;

    // Remove existing marks first to avoid duplicates
    el.querySelectorAll("mark[data-annotation-id]").forEach((m) => {
      const parent = m.parentNode;
      if (parent) {
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        parent.removeChild(m);
        parent.normalize();
      }
    });

    applyHighlights(el, annotations);
  }, [annotations, chapter.id]);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setTooltip(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setTooltip(null);
      return;
    }

    // Ensure selection is within the article
    const el = articleRef.current;
    if (!el || !el.contains(range.commonAncestorContainer)) {
      setTooltip(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 8,
      text: selectedText,
    });
  }, []);

  async function handleHighlight() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !tooltip) return;

    const range = selection.getRangeAt(0);
    const selectedText = tooltip.text;
    if (!selectedText) return;

    // Calculate character offsets within the article text
    const el = articleRef.current;
    if (!el) return;

    const preRange = document.createRange();
    preRange.setStart(el, 0);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset = startOffset + selectedText.length;

    setTooltip(null);
    selection.removeAllRanges();
    setIsCreating(true);

    try {
      const res = await fetch(`/api/annotations/${bookId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: chapter.id,
          startOffset,
          endOffset,
          selectedText,
          color: "yellow",
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { annotation: Annotation };
        onAnnotationCreate(data.annotation);
      }
    } catch (err) {
      console.error("Failed to create annotation:", err);
    } finally {
      setIsCreating(false);
    }
  }

  function dismissTooltip() {
    setTooltip(null);
  }

  return (
    <div className="relative">
      {/* Selection tooltip */}
      {tooltip && (
        <div
          className="fixed z-30 flex items-center gap-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg shadow-lg px-2 py-1 text-xs -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <button
            onClick={handleHighlight}
            disabled={isCreating}
            className="flex items-center gap-1 hover:text-yellow-300 dark:hover:text-yellow-600 transition-colors font-medium disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2zm-5 14H8v-2h4v2zm4-4H8v-2h8v2zm0-4H8V7h8v2z"/>
            </svg>
            Highlight
          </button>
          <button
            onClick={dismissTooltip}
            className="ml-1 hover:text-gray-300 dark:hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <article
        ref={articleRef}
        data-chapter-id={chapter.id}
        onMouseUp={handleMouseUp}
        className={`prose prose-gray dark:prose-invert max-w-none ${fontSizeClass[fontSize]} text-gray-800 dark:text-gray-200`}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {chapter.title}
        </h2>
        {/* Content is operator-supplied and rendered as whitespace-preserved text */}
        <div className="whitespace-pre-wrap break-words">{chapter.content}</div>
      </article>
    </div>
  );
}
