# Online Book Reader — Design

## Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 14 (App Router) | SSR catalog, client reader, API routes in one project |
| Language | TypeScript (strict) | Type safety across shared models |
| Styling | Tailwind CSS | Utility-first, easy dark mode via `class` strategy |
| Database | SQLite via `better-sqlite3` | Zero-config, serverless-friendly, synchronous API fits Next.js route handlers |
| Auth | JWT + httpOnly cookie | Stateless, secure, no external dependency |
| Password hashing | bcryptjs | Pure-JS bcrypt, works in edge-light Node runtimes |
| Validation | zod | Schema validation for API inputs and book JSON |

---

## Project Structure

```
bookgen/
├── data/
│   └── books/                   # JSON book files (e.g. moby-dick.json)
├── public/
│   └── covers/                  # Cover images referenced in book JSON
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── page.tsx             # Home / "Continue Reading"
│   │   ├── catalog/
│   │   │   └── page.tsx         # Book catalog with search & filter
│   │   ├── read/
│   │   │   └── [bookId]/
│   │   │       └── [chapterId]/
│   │   │           └── page.tsx # Reader page
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── api/
│   │       ├── books/
│   │       │   ├── route.ts                          # GET /api/books
│   │       │   └── [bookId]/
│   │       │       ├── route.ts                      # GET /api/books/[bookId]
│   │       │       └── chapters/[chapterId]/route.ts
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   ├── login/route.ts
│   │       │   └── logout/route.ts
│   │       ├── me/route.ts
│   │       ├── progress/[bookId]/route.ts
│   │       ├── bookmarks/
│   │       │   ├── [bookId]/route.ts
│   │       │   └── [bookmarkId]/route.ts
│   │       └── annotations/
│   │           ├── [bookId]/route.ts
│   │           └── [annotationId]/route.ts
│   ├── components/
│   │   ├── catalog/
│   │   │   ├── BookCard.tsx
│   │   │   ├── BookGrid.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── GenreFilter.tsx
│   │   ├── reader/
│   │   │   ├── ReaderLayout.tsx
│   │   │   ├── ChapterContent.tsx
│   │   │   ├── TableOfContents.tsx
│   │   │   ├── ReaderControls.tsx   # font size, theme toggle
│   │   │   ├── BookmarkPanel.tsx
│   │   │   └── AnnotationPanel.tsx
│   │   └── ui/
│   │       ├── Navbar.tsx
│   │       ├── ProgressBar.tsx
│   │       └── ThemeProvider.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts             # Singleton DB connection
│   │   │   ├── schema.ts            # CREATE TABLE statements + migration runner
│   │   │   └── repositories/
│   │   │       ├── books.ts
│   │   │       ├── users.ts
│   │   │       ├── progress.ts
│   │   │       ├── bookmarks.ts
│   │   │       └── annotations.ts
│   │   ├── books/
│   │   │   ├── loader.ts            # Scans data/books/, validates, upserts to DB
│   │   │   └── schema.ts            # Zod schema for book JSON
│   │   └── auth/
│   │       ├── jwt.ts               # sign / verify helpers
│   │       └── middleware.ts        # requireAuth() for route handlers
│   └── types/
│       └── index.ts                 # Shared TypeScript interfaces
├── db/
│   └── bookgen.db                   # SQLite database file (git-ignored)
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Database Schema

```sql
-- Books (populated from JSON files)
CREATE TABLE IF NOT EXISTS books (
  id          TEXT PRIMARY KEY,          -- matches JSON "id" slug
  title       TEXT NOT NULL,
  author      TEXT NOT NULL,
  genre       TEXT NOT NULL,             -- JSON array serialized as string
  description TEXT,
  cover_image TEXT,
  language    TEXT DEFAULT 'en',
  published_year INTEGER,
  chapter_count  INTEGER NOT NULL,
  file_path   TEXT NOT NULL,             -- absolute path to source JSON
  indexed_at  INTEGER NOT NULL           -- Unix timestamp
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name  TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Reading progress
CREATE TABLE IF NOT EXISTS reading_progress (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id     TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id  INTEGER NOT NULL,
  scroll_offset INTEGER DEFAULT 0,
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, book_id)
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id    TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id INTEGER NOT NULL,
  label      TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Annotations (highlights + optional notes)
CREATE TABLE IF NOT EXISTS annotations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id       TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id    INTEGER NOT NULL,
  start_offset  INTEGER NOT NULL,   -- character offset in chapter content
  end_offset    INTEGER NOT NULL,
  selected_text TEXT NOT NULL,
  note          TEXT,
  color         TEXT DEFAULT 'yellow',
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
```

---

## Data Flow

### Book Indexing (startup)

```
data/books/*.json
      │
      ▼
  lib/books/loader.ts
  • readdir(data/books/)
  • parse + validate each file with Zod schema
  • upsert into books table (INSERT OR REPLACE)
      │
      ▼
  SQLite books table  ←── all catalog queries read from here
```

The loader is invoked from `instrumentation.ts` (Next.js instrumentation hook) so it runs once on server startup in both dev and production.

### Authentication Flow

```
POST /api/auth/login
  → validate email/password with zod
  → query users table, compare bcrypt hash
  → sign JWT { userId, email } with 24h expiry
  → set httpOnly cookie "session"
  → return { user }

Subsequent requests
  → middleware reads cookie → verifies JWT
  → attaches user to request context
```

### Reader Data Flow

```
Client: navigates to /read/[bookId]/[chapterId]
  → Server Component fetches book metadata from DB (fast, no auth required)
  → Renders initial HTML with chapter content

Client hydrates:
  → ReaderLayout mounts
  → Fetches user bookmarks + annotations for this book (if authenticated)
  → Starts auto-save timer (10s) → PUT /api/progress/[bookId]
```

---

## Key Component Designs

### `ReaderLayout`

```
┌─────────────────────────────────────────────────┐
│  Navbar  [ Book Title ]           [☰ ToC] [⚙]   │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│  Table of    │   Chapter Content                │
│  Contents    │   (scrollable)                   │
│  (collapsible│                                  │
│   sidebar)   │                                  │
│              │                                  │
├──────────────┴──────────────────────────────────┤
│  ← Prev Chapter          Next Chapter →         │
└─────────────────────────────────────────────────┘
```

Reader settings panel (font size, theme) slides in from the top-right gear icon.

### `BookCard`

Displays: cover image, title, author, genre badge, progress bar (authenticated users), and "Read" / "Continue" CTA button.

### `ChapterContent`

- Renders sanitized HTML or plain text from chapter `content` field.
- Wraps content in a `<article>` with `data-chapter-id` attribute.
- Attaches mouse-up handler for text selection → triggers highlight creation flow.
- On mount, applies stored annotation highlights by wrapping matched text ranges in `<mark>` elements.

---

## Auth & Security Notes

- JWT secret loaded from `JWT_SECRET` env var (required; app refuses to start without it).
- Passwords never returned in API responses.
- All user-scoped endpoints verify that the requesting user owns the resource before mutating.
- Annotation `selected_text` is stored as-is; rendered with `textContent` (not `innerHTML`) to prevent XSS.
- Book JSON `content` is treated as trusted (operator-supplied), but rendered via a sanitized HTML renderer.

---

## Environment Variables

```env
JWT_SECRET=your-secret-here          # required
DATABASE_PATH=./db/bookgen.db        # optional, defaults to ./db/bookgen.db
BOOKS_DATA_DIR=./data/books          # optional, defaults to ./data/books
NODE_ENV=development
```
