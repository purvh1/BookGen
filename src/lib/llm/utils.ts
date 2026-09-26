// ─── Slug Utility ─────────────────────────────────────────────────────────────

/**
 * Convert any string to a URL-safe slug.
 *
 * Rules:
 *  - Lowercases the text
 *  - Strips characters that are not alphanumeric or spaces
 *  - Replaces runs of whitespace with a single `-`
 *  - Collapses consecutive `-` into one
 *  - Trims leading and trailing `-`
 *  - Returns `"untitled"` for blank / whitespace-only input
 */
export function slugify(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "untitled";

  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // strip non-alphanumeric (keep spaces)
    .replace(/\s+/g, "-")        // collapse whitespace → single dash
    .replace(/-+/g, "-")         // collapse consecutive dashes
    .replace(/^-+|-+$/g, "");    // trim leading / trailing dashes
}

// ─── JSON Block Extractor ─────────────────────────────────────────────────────

/**
 * Extract and parse the first JSON object from an LLM response that may wrap
 * it in ` ```json ... ``` ` code fences.
 *
 * Returns the parsed value on success, or `null` on any failure (no throws).
 */
export function extractJsonBlock(raw: string): unknown | null {
  try {
    const match = raw.match(/```json\s*\n([\s\S]*?)\n```/);
    if (!match) return null;

    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}
