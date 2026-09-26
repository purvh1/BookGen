# Online Book Reader — Implementation Tasks

## Task List

- [x] 1. Project scaffolding
- [x] 2. SQLite database layer
- [x] 3. Book JSON loader
- [x] 4. Book catalog API routes
- [x] 5. Auth API routes (register, login, logout, me)
- [x] 6. Reading progress API
- [x] 7. Bookmarks API
- [x] 8. Annotations API
- [x] 9. Catalog UI (home + catalog pages)
- [x] 10. Reader UI
- [x] 11. Auth UI (login + register pages)
- [x] 12. Sample book data

---

## Task Details

### Task 1 — Project Scaffolding

Set up the Next.js 14 project with all required dependencies and configuration.

**Steps:**
1. Bootstrap with `create-next-app` (TypeScript, App Router, Tailwind CSS, ESLint, src/ dir).
2. Install runtime dependencies:
   - `better-sqlite3` + `@types/better-sqlite3`
   - `bcryptjs` + `@types/bcryptjs`
   - `jsonwebtoken` + `@types/jsonwebtoken`
   - `zod`
3. Create directory skeleton:
   - `data/books/`
   - `public/covers/`
   - `db/` (git-ignored)
   - `src/lib/db/repositories/`
   - `src/lib/books/`
   - `src/lib/auth/`
   - `src/types/`
4. Add `.env.local` with `JWT_SECRET`, `DATABASE_PATH`, `BOOKS_DATA_DIR`.
5. Add `db/` and `.env.local` to `.gitignore`.
6. Configure `tailwind.config.ts` with `darkMode: 'class'`.
7. Create `src/types/index.ts` with shared interfaces:
   - `Book`, `Chapter`, `User`, `ReadingProgress`, `Bookmark`, `Annotation`

**Acceptance:** `next dev` starts without errors.

---

### Task 2 — SQLite Database Layer

Implement the database connection singleton and schema migration.

**Files to create:**
- `src/lib/db/index.ts` — opens (or creates) the SQLite file, returns singleton `Database` instance.
- `src/lib/db/schema.ts` — runs `CREATE TABLE IF NOT EXISTS` for all five tables; called on DB init.
- `src/lib/db/repositories/books.ts` — `upsertBook`, `listBooks` (with optional search/filter/pagination), `getBookById`.
- `src/lib/db/repositories/users.ts` — `createUser`, `getUserByEmail`, `getUserById`.
- `src/lib/db/repositories/progress.ts` — `getProgress`, `upsertProgress`, `getRecentlyRead`.
- `src/lib/db/repositories/bookmarks.ts` — `listBookmarks`, `addBookmark`, `deleteBookmark`.
- `src/lib/db/repositories/annotations.ts` — `listAnnotations`, `addAnnotation`, `deleteAnnotation`.

**Acceptance:** Running a small test script that imports the DB singleton, creates tables, and performs a CRUD round-trip on the `users` table succeeds without errors.

---

### Task 3 — Book JSON Loader

Scan `data/books/` and synchronise the SQLite `books` table.

**Files to create:**
- `src/lib/books/schema.ts` — Zod schema matching the book JSON format defined in requirements.
- `src/lib/books/loader.ts`:
  - Reads all `*.json` files from `BOOKS_DATA_DIR`.
  - Validates each against the Zod schema; logs a warning and skips on failure.
  - Calls `upsertBook` for each valid file.
- `src/instrumentation.ts` — Next.js instrumentation hook that calls the loader on the `nodejs` runtime.

**Acceptance:** Dropping a valid `sample.json` in `data/books/` and starting the dev server inserts the book row into SQLite.

---

### Task 4 — Book Catalog API Routes

**Files to create:**
- `src/app/api/books/route.ts`
  - `GET`: accepts query params `search`, `genre`, `page`, `limit`; returns `{ books, total, page, limit }`.
- `src/app/api/books/[bookId]/route.ts`
  - `GET`: returns book metadata + chapter stubs (id + title, no content); 404 if not found.
- `src/app/api/books/[bookId]/chapters/[chapterId]/route.ts`
  - `GET`: reads the source JSON file, extracts the matching chapter, returns `{ chapter }`.

**Acceptance:**
- `GET /api/books` returns paginated list.
- `GET /api/books/sample` returns metadata for the sample book.
- `GET /api/books/sample/chapters/1` returns chapter content.

---

### Task 5 — Auth API Routes

**Files to create:**
- `src/lib/auth/jwt.ts` — `signToken(payload)`, `verifyToken(token)` using `jsonwebtoken`.
- `src/lib/auth/middleware.ts` — `requireAuth(request)`: reads `session` cookie, verifies JWT, returns user or throws 401.
- `src/app/api/auth/register/route.ts` — validates input, hashes password, inserts user, returns 201.
- `src/app/api/auth/login/route.ts` — verifies credentials, sets httpOnly `session` cookie with signed JWT.
- `src/app/api/auth/logout/route.ts` — clears `session` cookie.
- `src/app/api/me/route.ts` — returns current user info (no password hash).

**Acceptance:**
- Register → Login → GET /api/me returns user object.
- Logout → GET /api/me returns 401.

---

### Task 6 — Reading Progress API

**Files to create:**
- `src/app/api/progress/[bookId]/route.ts`
  - `GET`: returns progress for authenticated user on given book.
  - `PUT`: upserts `{ chapterId, scrollOffset }` for authenticated user.

**Acceptance:** PUT then GET returns the same chapter/offset.

---

### Task 7 — Bookmarks API

**Files to create:**
- `src/app/api/bookmarks/[bookId]/route.ts`
  - `GET`: lists all bookmarks for user + book.
  - `POST`: creates bookmark `{ chapterId, label? }`.
- `src/app/api/bookmarks/[bookmarkId]/route.ts`
  - `DELETE`: deletes bookmark; validates ownership.

**Acceptance:** POST → GET returns new bookmark; DELETE removes it.

---

### Task 8 — Annotations API

**Files to create:**
- `src/app/api/annotations/[bookId]/route.ts`
  - `GET`: lists annotations for user + book.
  - `POST`: creates annotation `{ chapterId, startOffset, endOffset, selectedText, note?, color? }`.
- `src/app/api/annotations/[annotationId]/route.ts`
  - `DELETE`: deletes annotation; validates ownership.

**Acceptance:** POST → GET returns new annotation; DELETE removes it.

---

### Task 9 — Catalog UI

**Files to create:**
- `src/components/ui/Navbar.tsx` — site header with logo, catalog link, auth links / user menu.
- `src/components/ui/ThemeProvider.tsx` — wraps app, reads/writes `theme` cookie, applies `dark` class to `<html>`.
- `src/components/ui/ProgressBar.tsx` — reusable horizontal progress bar.
- `src/components/catalog/BookCard.tsx` — cover image, title, author, genre badge, progress bar, CTA button.
- `src/components/catalog/BookGrid.tsx` — responsive grid of `BookCard`s.
- `src/components/catalog/SearchBar.tsx` — controlled text input with debounce (300 ms).
- `src/components/catalog/GenreFilter.tsx` — pill/chip list of available genres derived from current catalog.
- `src/app/catalog/page.tsx` — Server Component: fetches books from `/api/books`; renders `SearchBar`, `GenreFilter`, `BookGrid`, pagination controls.
- `src/app/page.tsx` — Home page: "Continue Reading" section (last 3 books), then full catalog.

**Acceptance:** Catalog page renders books server-side, search and filter update URL query params and re-fetch.

---

### Task 10 — Reader UI

**Files to create:**
- `src/components/reader/ReaderLayout.tsx` — shell with sidebar + content area layout.
- `src/components/reader/TableOfContents.tsx` — collapsible list of chapter links; highlights current.
- `src/components/reader/ChapterContent.tsx` — renders chapter text; handles text selection for annotation creation; applies stored highlights on mount.
- `src/components/reader/ReaderControls.tsx` — font size selector (small/medium/large), theme toggle; persisted in `localStorage`.
- `src/components/reader/BookmarkPanel.tsx` — lists bookmarks; add/delete actions; clicking navigates.
- `src/components/reader/AnnotationPanel.tsx` — lists annotations with `selectedText` preview and note; delete action.
- `src/app/read/[bookId]/[chapterId]/page.tsx` — Server Component that pre-renders chapter; passes data to `ReaderLayout`.

**Reader behaviour:**
- Auto-save reading position via `useEffect` on a 10-second interval (PUT `/api/progress/[bookId]`).
- Chapter navigation updates URL without full reload using `router.push`.
- Text selection highlight flow: `mouseup` → selection API → show tooltip → "Highlight" button → POST `/api/annotations/[bookId]`.

**Acceptance:**
- Reader displays chapter content with correct typography.
- Font size and theme preferences persist across page reloads.
- Bookmarks and annotations can be created and deleted.
- Progress is saved automatically.

---

### Task 11 — Auth UI

**Files to create:**
- `src/app/login/page.tsx` — email + password form; POSTs to `/api/auth/login`; redirects to home on success.
- `src/app/register/page.tsx` — display name + email + password form; POSTs to `/api/auth/register`; redirects to login on success.
- Client-side form validation with inline error messages (no external form library required).

**Acceptance:** Full register → login → view protected page → logout flow works end-to-end.

---

### Task 12 — Sample Book Data

Create two sample books to validate the end-to-end flow.

**Files to create:**
- `data/books/alice-in-wonderland.json` — at least 3 chapters of public-domain text.
- `data/books/sherlock-holmes.json` — at least 3 chapters of public-domain text.
- `public/covers/alice-in-wonderland.jpg` — placeholder cover image.
- `public/covers/sherlock-holmes.jpg` — placeholder cover image.

**Acceptance:** Both books appear in the catalog and are readable chapter-by-chapter.
