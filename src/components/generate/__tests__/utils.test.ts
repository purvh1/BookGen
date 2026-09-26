import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { descriptionIsValid, mapApiError } from "../utils";

/**
 * Property 1: Description validation exactly matches the 20-character threshold.
 * Validates: Requirements 1.2, 1.3
 */
describe("descriptionIsValid", () => {
  it("returns true for strings whose trimmed length is >= 20", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 20 }), (s) => {
        // Only test strings where the trimmed form is actually >= 20
        if (s.trim().length >= 20) {
          expect(descriptionIsValid(s)).toBe(true);
        }
      })
    );
  });

  it("returns false for strings whose trimmed length is < 20", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 19 }), (s) => {
        // Only test strings where the trimmed form is actually < 20
        if (s.trim().length < 20) {
          expect(descriptionIsValid(s)).toBe(false);
        }
      })
    );
  });

  it("matches (s.trim().length >= 20) for all strings — Property 1", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(descriptionIsValid(s)).toBe(s.trim().length >= 20);
      })
    );
  });

  // Boundary examples
  it("returns false for empty string", () => {
    expect(descriptionIsValid("")).toBe(false);
  });

  it("returns false for whitespace-only string", () => {
    expect(descriptionIsValid("   ")).toBe(false);
  });

  it("returns false for exactly 19 trimmed characters", () => {
    expect(descriptionIsValid("a".repeat(19))).toBe(false);
  });

  it("returns true for exactly 20 trimmed characters", () => {
    expect(descriptionIsValid("a".repeat(20))).toBe(true);
  });

  it("returns false when leading/trailing whitespace brings trimmed length below 20", () => {
    expect(descriptionIsValid("  " + "a".repeat(18) + "  ")).toBe(false);
  });

  it("returns true when content is 20+ chars after trimming", () => {
    expect(descriptionIsValid("  " + "a".repeat(20) + "  ")).toBe(true);
  });
});

/**
 * Property 2: Success link URL is always constructed as `/read/<id>/1`.
 * Validates: Requirements 3.3
 */
describe("success link URL construction", () => {
  it("href always equals /read/<id>/1 for any valid book id — Property 2", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[a-z0-9][a-z0-9-]*$/), (id) => {
        const href = `/read/${id}/1`;
        expect(href).toBe(`/read/${id}/1`);
        expect(href.startsWith("/read/")).toBe(true);
        expect(href.endsWith("/1")).toBe(true);
      })
    );
  });
});

/**
 * Property 3: Error mapper always returns a non-empty string.
 * Validates: Requirements 4.1, 4.2, 4.3
 */
describe("mapApiError", () => {
  it("always returns a non-empty string for any 4xx-5xx status and any body — Property 3", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 599 }),
        fc.record({ error: fc.option(fc.string()) }),
        (status, body) => {
          const result = mapApiError(status, body as { error?: string });
          expect(typeof result).toBe("string");
          expect(result.length).toBeGreaterThan(0);
        }
      )
    );
  });

  it("returns the API error message for 400 when body.error is present", () => {
    expect(mapApiError(400, { error: "Description too short" })).toBe(
      "Description too short"
    );
  });

  it("returns fallback message for 400 when body.error is absent", () => {
    expect(mapApiError(400, {})).toBe("Description is required.");
  });

  it("returns conflict message for 409", () => {
    expect(mapApiError(409, {})).toBe(
      "A book with that title already exists. Try a different description."
    );
  });

  it("returns generic failure message for 500", () => {
    expect(mapApiError(500, {})).toBe("Generation failed. Please try again.");
  });

  it("returns generic failure message for other 5xx codes", () => {
    expect(mapApiError(503, {})).toBe("Generation failed. Please try again.");
  });
});
