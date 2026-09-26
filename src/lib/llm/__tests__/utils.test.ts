/**
 * Property-based tests for slugify and extractJsonBlock.
 *
 * Validates: Requirements REQ-4.2, REQ-4.3
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { slugify, extractJsonBlock } from "../utils";

// ─── slugify properties ───────────────────────────────────────────────────────

describe("slugify", () => {
  it("output is always lowercase", () => {
    fc.assert(
      fc.property(fc.unicodeString(), (s) => {
        const output = slugify(s);
        expect(output).toBe(output.toLowerCase());
      })
    );
  });

  it("output contains only [a-z0-9-] characters", () => {
    fc.assert(
      fc.property(fc.unicodeString(), (s) => {
        const output = slugify(s);
        expect(/^[a-z0-9-]*$/.test(output)).toBe(true);
      })
    );
  });

  it("output never starts or ends with a dash", () => {
    fc.assert(
      fc.property(fc.unicodeString(), (s) => {
        const output = slugify(s);
        expect(output.startsWith("-")).toBe(false);
        expect(output.endsWith("-")).toBe(false);
      })
    );
  });

  it("empty string input returns 'untitled'", () => {
    fc.assert(
      fc.property(fc.constant(""), (s) => {
        expect(slugify(s)).toBe("untitled");
      })
    );
  });

  it("whitespace-only input returns 'untitled'", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\s+$/),
        (s) => {
          expect(slugify(s)).toBe("untitled");
        }
      )
    );
  });

  it("is a pure function (same input always produces same output)", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(slugify(s)).toBe(slugify(s));
      })
    );
  });
});

// ─── extractJsonBlock properties ─────────────────────────────────────────────

describe("extractJsonBlock", () => {
  it("parses valid JSON wrapped in ```json fences", () => {
    // Use fc.object() to generate JSON objects (records), which guarantees
    // the parsed result is never null and can be round-tripped via JSON.stringify.
    fc.assert(
      fc.property(fc.object(), (value) => {
        const json = JSON.stringify(value);
        const raw = "```json\n" + json + "\n```";
        const result = extractJsonBlock(raw);
        expect(result).not.toBeNull();
        expect(JSON.stringify(result)).toBe(json);
      })
    );
  });

  it("returns null when there is no ```json fence", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !s.includes("```json")),
        (s) => {
          expect(extractJsonBlock(s)).toBeNull();
        }
      )
    );
  });

  it("returns null (no throw) for malformed JSON inside a fence", () => {
    fc.assert(
      fc.property(
        // Generate strings that are not valid JSON
        fc.string().filter((s) => {
          try {
            JSON.parse(s);
            return false; // skip valid JSON strings
          } catch {
            return true;
          }
        }),
        (s) => {
          const raw = "```json\n" + s + "\n```";
          expect(() => extractJsonBlock(raw)).not.toThrow();
          expect(extractJsonBlock(raw)).toBeNull();
        }
      )
    );
  });
});
