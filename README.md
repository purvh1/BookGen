# BookGen

An AI-powered web book reader that lets you generate complete books from a plain-text description. Describe any book you can imagine and the AI writes it — chapter by chapter — and adds it to your personal library.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8) ![AWS Bedrock](https://img.shields.io/badge/AWS-Bedrock-orange)

---

## Features

- **AI Book Generation** — describe a book and get a full multi-chapter manuscript in 1–2 minutes via AWS Bedrock
- **Book Catalog** — browse, search, and filter your library with genre filters and pagination
- **In-browser Reader** — read books chapter by chapter with progress tracking
- **Text-based Covers** — deterministic SVG covers generated from title and genre (8 color palettes, no images needed)
- **User Auth** — register/login with JWT-based sessions and bcrypt password hashing
- **Dark Mode** — full light/dark theme support

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Database | SQLite via `better-sqlite3` |
| AI | AWS Bedrock — Moonshot AI Kimi K3 (or any Bedrock model) |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |
| Testing | Vitest + fast-check (property-based tests) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An AWS account with Bedrock access and a model enabled (see [Bedrock model access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env` to `.env.local` and fill in the required values:

```bash
cp .env .env.local
```

Edit `.env.local`:

```env
# JWT secret — use a long random string in production
JWT_SECRET=change-me-to-a-long-random-secret-value

# SQLite database path (relative to project root)
DATABASE_PATH=./db/bookgen.db

# Directory where generated book JSON files are stored
BOOKS_DATA_DIR=./data/books

# AWS credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Bedrock model ID or cross-region inference profile
# Examples:
#   us.moonshotai.kimi-k3                            (Kimi K3 US geo profile)
#   us.anthropic.claude-3-5-sonnet-20241022-v2:0     (Claude 3.5 Sonnet)
#   anthropic.claude-3-haiku-20240307-v1:0            (Claude 3 Haiku, no profile)
BEDROCK_MODEL_ID=us.moonshotai.kimi-k3
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The SQLite database and `data/books/` directory are created automatically on first run. Any JSON book files already in `data/books/` are indexed into SQLite on startup via the Next.js instrumentation hook.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # login / logout / register endpoints
│   │   ├── books/         # GET /api/books (list + search)
│   │   ├── generate/book/ # POST /api/generate/book
│   │   └── me/            # GET /api/me (current user)
│   ├── catalog/           # /catalog page
│   ├── generate/          # /generate page
│   ├── login/             # /login page
│   ├── read/              # /read/[id]/[chapter] reader page
│   └── register/          # /register page
├── components/
│   ├── catalog/           # BookCard, BookCover, BookGrid, filters, pagination
│   ├── generate/          # GenerateForm + validation helpers
│   ├── reader/            # Chapter reader components
│   └── ui/                # Navbar, ProgressBar, ThemeProvider
└── lib/
    ├── books/             # schema (Zod), loader (indexes JSON files on startup)
    ├── db/                # SQLite setup + repositories (books, users, progress)
    └── llm/               # BedrockProvider, BookGeneratorService, utils
```

---

## Generating a Book

1. Navigate to [/generate](http://localhost:3000/generate) or click **Generate** in the nav
2. Type a description of the book you want (at least 20 characters)
3. Click **Generate Book** — the AI will:
   - Generate a book index (title, author, chapters list) as JSON
   - Write each chapter sequentially
   - Validate the assembled book against the Zod schema
   - Save it as a JSON file in `data/books/` and index it in SQLite
4. When done, a success card appears with a **Read Now →** link

Generation takes 1–2 minutes depending on the model and chapter count.

---

## Book JSON Format

Books are stored as JSON files in `BOOKS_DATA_DIR`. Each file follows this schema:

```json
{
  "id": "the-great-adventure",
  "title": "The Great Adventure",
  "author": "AI Author",
  "genre": ["Adventure", "Fiction"],
  "description": "A thrilling tale...",
  "coverImage": "",
  "language": "en",
  "publishedYear": 2024,
  "chapters": [
    { "id": 1, "title": "Chapter Title", "content": "Full chapter text..." }
  ]
}
```

You can drop hand-crafted JSON files into `data/books/` and they'll be picked up on the next server restart.

---

## Available Scripts

```bash
npm run dev            # Start dev server (http://localhost:3000)
npm run build          # Production build
npm run start          # Start production server
npm run lint           # ESLint
npm run test           # Run all tests (Vitest)
npm run test:coverage  # Run tests with coverage report
```

---

## Running Tests

```bash
npm test
```

The test suite uses [Vitest](https://vitest.dev/) with [fast-check](https://fast-check.dev/) for property-based testing. Tests cover:

- `slugify` and `extractJsonBlock` utilities (9 property tests)
- `BookSchema` Zod validation round-trips (5 property tests)
- `descriptionIsValid` and `mapApiError` UI helpers (16 property tests)

---

## Choosing a Bedrock Model

The `BedrockProvider` uses the Bedrock **Converse API**, which is model-agnostic. Any model that supports Converse will work — just update `BEDROCK_MODEL_ID` in `.env.local`.

| Model | BEDROCK_MODEL_ID | Notes |
|---|---|---|
| Kimi K3 (US geo) | `us.moonshotai.kimi-k3` | Recommended — 1M context, reasoning |
| Kimi K3 (Global) | `global.moonshotai.kimi-k3` | Routes worldwide |
| Claude 3.5 Sonnet | `us.anthropic.claude-3-5-sonnet-20241022-v2:0` | Strong creative writing |
| Claude 3 Haiku | `anthropic.claude-3-haiku-20240307-v1:0` | Fastest / cheapest |

Cross-region profile IDs (`us.*`, `global.*`) don't require a custom inference profile ARN.

---

## License

MIT
