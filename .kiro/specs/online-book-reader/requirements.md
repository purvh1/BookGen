# Online Book Reader — Requirements

## Overview

A web-based book reading platform built with Next.js. The backend serves book content from a local `data/books/` folder where each book is stored as a structured JSON file. SQLite is used for all persistence needs (user accounts, reading progress, bookmarks, and annotations).

---

## Functional Requirements

### 1. Book Catalog

- **REQ-1.1** The system SHALL scan the `data/books/` directory at startup and register all valid JSON book files in the SQLite `books` table.
- **REQ-1.2** The catalog page SHALL display all available books with cover image, title, author, genre, and a short description.
- **REQ-1.3** Users SHALL be able to search books by title or author.
- **REQ-1.4** Users SHALL be able to filter books by genre/category.
- **REQ-1.5** The catalog SHALL support pagination (default 12 books per page).

### 2. Book JSON Format

Each book file under `data/books/<slug>.json` MUST conform to the following structure:

```json
{
  "id": "unique-slug",
  "title": "Book Title",
  "author": "Author Name",
  "genre": ["Fiction", "Adventure"],
  "description": "Short synopsis...",
  "coverImage": "/covers/slug.jpg",
  "language": "en",
  "publishedYear": 2020,
  "chapters": [
    {
      "id": 1,
      "title": "Chapter One",
      "content": "Full text content of the chapter..."
    }
  ]
}
```

- **REQ-2.1** The loader SHALL validate each JSON file against this schema on import; malformed files SHALL be skipped with a logged warning.
- **REQ-2.2** The `chapters` array SHALL contain at least one chapter.

### 3. Book Reader

- **REQ-3.1** Clicking a book SHALL navigate to the reader at `/read/[bookId]/[chapterId]`.
- **REQ-3.2** The reader SHALL display chapter content with comfortable typography settings.
- **REQ-3.3** Users SHALL be able to navigate between chapters (previous / next).
- **REQ-3.4** A collapsible table of contents sidebar SHALL list all chapters.
- **REQ-3.5** The reader SHALL support adjustable font size (small / medium / large).
- **REQ-3.6** The reader SHALL support light and dark themes.
- **REQ-3.7** Reading position (chapter + scroll offset) SHALL be auto-saved every 10 seconds for authenticated users.

### 4. User Accounts

- **REQ-4.1** Users SHALL be able to register with email and password.
- **REQ-4.2** Passwords SHALL be hashed with bcrypt before storage.
- **REQ-4.3** Users SHALL be able to log in and receive a session token (JWT stored in an httpOnly cookie).
- **REQ-4.4** Users SHALL be able to log out, which invalidates the session cookie.
- **REQ-4.5** Protected routes SHALL redirect unauthenticated users to `/login`.

### 5. Reading Progress

- **REQ-5.1** For authenticated users, the last-read chapter and scroll position SHALL be persisted in SQLite.
- **REQ-5.2** The catalog card for a book SHALL show a progress bar indicating the percentage of chapters read.
- **REQ-5.3** A "Continue Reading" section on the home page SHALL list the three most recently read books.

### 6. Bookmarks

- **REQ-6.1** Authenticated users SHALL be able to bookmark any chapter.
- **REQ-6.2** A bookmarks panel SHALL list all bookmarks for the current book, sorted by chapter order.
- **REQ-6.3** Clicking a bookmark SHALL navigate to that chapter.
- **REQ-6.4** Users SHALL be able to delete individual bookmarks.

### 7. Annotations (Highlights + Notes)

- **REQ-7.1** Authenticated users SHALL be able to highlight a text selection within a chapter.
- **REQ-7.2** Users MAY attach a text note to a highlight.
- **REQ-7.3** Highlights SHALL be rendered inline when the chapter is loaded.
- **REQ-7.4** A notes panel SHALL list all annotations for the current book.
- **REQ-7.5** Users SHALL be able to delete annotations.

### 8. API Endpoints

All API routes are under `/api/`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/books` | List books (search, filter, paginate) |
| GET | `/api/books/[bookId]` | Book metadata + chapter list |
| GET | `/api/books/[bookId]/chapters/[chapterId]` | Single chapter content |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, set session cookie |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/me` | Current user info |
| GET/PUT | `/api/progress/[bookId]` | Get/update reading progress |
| GET/POST | `/api/bookmarks/[bookId]` | List/add bookmarks |
| DELETE | `/api/bookmarks/[bookmarkId]` | Delete bookmark |
| GET/POST | `/api/annotations/[bookId]` | List/add annotations |
| DELETE | `/api/annotations/[annotationId]` | Delete annotation |

---

## Non-Functional Requirements

- **NFR-1** The application SHALL be built with **Next.js 14+** using the App Router.
- **NFR-2** All database access SHALL use **better-sqlite3** (synchronous SQLite driver) via a repository layer.
- **NFR-3** The UI SHALL use **Tailwind CSS** for styling.
- **NFR-4** The application SHALL be fully responsive (mobile, tablet, desktop).
- **NFR-5** Initial page load (catalog) SHALL render server-side for SEO.
- **NFR-6** API routes SHALL return structured JSON error responses with appropriate HTTP status codes.
- **NFR-7** The reader page SHALL use client-side navigation for chapter transitions (no full page reload).
- **NFR-8** TypeScript SHALL be used throughout; strict mode enabled.
