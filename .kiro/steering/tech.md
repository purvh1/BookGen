# Tech Stack

## Framework & Language
- **Next.js 14** (App Router) with **TypeScript**
- **React 18** for UI components
- Server Components are used for data-fetching pages; Client Components only where interactivity is required

## Styling
- **Tailwind CSS v3** — utility-first, no CSS modules or styled-components
- Dark mode support via Tailwind's `dark:` variant (class strategy assumed)

## Database
- **better-sqlite3** — synchronous SQLite accessed through a singleton `getDb()` from `src/lib/db/index.ts`
- Schema is managed via raw SQL migrations in `src/lib/db/schema.ts` (no ORM)
- WAL mode and foreign keys are enabled on every connection
- DB file defaults to `./db/bookgen.db`; overridable via `DATABASE_PATH` env var

## Auth
- **jsonwebtoken** for JWT signing/verification
- Session stored in an httpOnly `session` cookie
- `requireAuth(request)` helper in `src/lib/auth/middleware.ts` — throws a `Response` with 401 on failure

## Validation
- **Zod** for all schema validation (book JSON ingestion, API inputs)

## Key Environment Variables
| Variable | Purpose |
|---|---|
| `DATABASE_PATH` | Path to SQLite file (default: `./db/bookgen.db`) |
| `JWT_SECRET` | Secret for signing JWTs |
| `NEXT_PUBLIC_BASE_URL` | Base URL used in server-side fetch calls |

## Common Commands
```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint via next lint
```

## Notes
- `instrumentationHook: true` is enabled in `next.config.mjs` so `src/instrumentation.ts` runs on server startup to load book JSON files into the DB.
- Images are set to `unoptimized: true` to serve local cover files without a configured domain.
