# Implementation Plan: Book Generation UI

## Overview

Implement the Book Generation UI by adding two new files (`GenerateForm.tsx`
and `generate/page.tsx`), updating the `Navbar`, and wiring everything together.
All tasks use TypeScript and Tailwind CSS; no new npm packages are introduced.
Two pure helper functions (`descriptionIsValid`, `mapApiError`) are extracted
for testability.

---

## Tasks

- [ ] 1. Implement `GenerateForm` component with helper utilities and property tests
  - Create `src/components/generate/GenerateForm.tsx` as a `"use client"` component
  - Define `Status` type (`idle | loading | success | error`) and local state (`status`, `errorMessage`, `book`)
  - Extract `descriptionIsValid(text: string): boolean` — returns `true` iff `text.trim().length >= 20`
  - Extract `mapApiError(status: number, body: { error?: string }): string` — maps 400/409/5xx to user-facing strings
  - Render textarea with `<label htmlFor>`, character counter, and conditional enable/disable of submit button (Requirements 1.1–1.4, 7.1)
  - Implement `handleSubmit`: set `status = "loading"`, POST to `/api/generate/book`, handle 201/400/409/5xx (Requirements 2.1–2.3, 3.1, 4.1–4.4)
  - Render loading state: spinner SVG + "Generating your book… This can take a minute or two." (Requirement 2.2)
  - Render inline error with `role="alert"` and red text (Requirements 4.4, 4.5, 7.4)
  - Render `SuccessCard` when `status === "success"`: checkmark icon, book title, "Read Now →" link to `/read/<id>/1` with `aria-label`, "Generate another" reset button (Requirements 3.2–3.4, 7.5)
  - Set `aria-busy="true"` on submit button while loading; submit button is `<button type="submit">` (Requirements 7.2, 7.3)

  - [ ]* 1.1 Write property tests for `descriptionIsValid` and `mapApiError`
    - Create `src/components/generate/__tests__/utils.test.ts`
    - Use `fast-check` (`fc.string()`, `fc.integer()`) — already in devDependencies
    - **Property 1: Description validation exactly matches the 20-character threshold** — `fc.string()` → assert `descriptionIsValid(s) === (s.trim().length >= 20)`
    - **Validates: Requirements 1.2, 1.3**
    - **Property 2: Success link URL is always constructed as `/read/<id>/1`** — `fc.string()` for id → assert link href equals `/read/${id}/1`
    - **Validates: Requirements 3.3**
    - **Property 3: Error mapper always returns a non-empty string** — `fc.integer({ min: 400, max: 599 })` + arbitrary body → assert result is a non-empty string
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 2. Create `/generate` page and add the Navbar link
  - Create `src/app/generate/page.tsx` as a server component with heading "Generate a Book", a subtitle, and `<GenerateForm />` (Requirements 5.1–5.4)
  - Apply the standard `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10` wrapper
  - Edit `src/components/ui/Navbar.tsx`: add a `<Link href="/generate">` styled consistently with the "Catalog" link, positioned between "Catalog" and the theme toggle (Requirements 6.1–6.3)

- [ ] 3. Checkpoint — verify build and tests
  - Run `tsc --noEmit` (zero TypeScript errors)
  - Run `npx vitest --run` (all tests pass, including new property tests)
  - Ensure all tests pass; ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `descriptionIsValid` and `mapApiError` must be exported from `GenerateForm.tsx` (or a sibling `utils.ts`) so they are importable by the test file
- `fast-check` is already in `devDependencies` — no install needed
- The existing Navbar uses a `"use client"` directive; the Generate link can be added directly alongside the Catalog link without any structural change

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2"] }
  ]
}
```
