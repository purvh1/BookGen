# Project Structure

```
bookgen/
├── data/books/          # Book source files (*.json). Add books here to ingest them.
├── db/                  # SQLite database file (git-ignored, created at runtime)
├── public/covers/       # Book cover images served statically
├── scripts/             # Utility/seed scripts
└── src/
    ├── app/             # Next.js App Router — pages and API routes
    │   ├── api/
    │   │   ├── auth/        # POST /api/auth/login, /api/auth/logout, /api/auth/register
    │   │   ├── books/       # GET /api/books, GET /api/books/[id]
    │   │   ├── annotations/ # CRUD for text annotations
    │   │   ├── bookmarks/   # CRUD for bookmarks
    │   │   ├── progress/    # Reading progress upsert/fetch
    │   │   └── me/          # Authenticated user info
    │   ├── catalog/         # /catalog page (book listing)
    │   ├── login/           # /login page
    │   ├── register/        # /register page
    │   ├── read/            # /read/[bookId]/[chapterId] reader page
    │   ├── layout.tsx       # Root layout (nav, global providers)
    │   ├── page.tsx         # Home page (featured books)
    │   └── globals.css      # Tailwind base imports
    ├── components/
    │   ├── catalog/         # BookCard, BookGrid, search/filter UI
    │   ├── reader/          # Chapter view, annotation toolbar, bookmark controls
    │   └── ui/              # Shared primitives (buttons, modals, etc.)
    ├── lib/
    │   ├── auth/
    │   │   ├── jwt.ts           # signToken / verifyToken
    │   │   └── middleware.ts    # requireAuth() — use in all protected API routes
    │   ├── books/
    │   │   ├── loader.ts        # Reads data/books/*.json and upserts into DB
    │   │   └── schema.ts        # Zod BookSchema / ChapterSchema
    │   └── db/
    │       ├── index.ts         # getDb() singleton
    │       ├── schema.ts        # SQL migration statements
    │       └── repositories/    # One file per entity (books, users, progress, bookmarks, annotations)
    ├── types/               # Shared TypeScript types/interfaces
    └── instrumentation.ts   # Next.js startup hook — calls book loader
```

## Conventions
- **API routes** live in `src/app/api/` using Next.js Route Handler files (`route.ts`).
- **Protected routes** call `requireAuth(request)` at the top and return its thrown `Response` directly if it throws.
- **DB access** always goes through `getDb()` and then the appropriate repository function — never instantiate `Database` directly.
- **Validation** at API boundaries uses Zod `.safeParse()` and returns a 400 JSON error on failure.
- **Path alias** `@/` maps to `src/` (configured in `tsconfig.json`).
- Repository files export plain functions (not classes) that accept a `db` parameter or call `getDb()` internally.
