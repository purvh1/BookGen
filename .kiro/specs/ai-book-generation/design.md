# Design: AI Book Generation via AWS Bedrock

## Architecture Overview

The feature follows the existing layered pattern in the project:
`API route → Service → LLM Provider + Repository`.

```
POST /api/generate/book
        │
        ▼
src/app/api/generate/book/route.ts
        │
        ▼
src/lib/llm/generator.ts   (BookGeneratorService)
     ├──▶  src/lib/llm/bedrock.ts   (BedrockProvider)  ← AWS SDK
     ├──▶  src/lib/books/schema.ts  (BookSchema Zod)
     └──▶  src/lib/db/repositories/books.ts  (upsertBook)
                       │
                       ▼
               data/books/<id>.json   (written to disk)
               SQLite books table     (upsertBook)
```

## New Files

| File | Role |
|------|------|
| `src/lib/llm/bedrock.ts` | Thin AWS Bedrock client wrapper |
| `src/lib/llm/utils.ts` | `slugify()` + `extractJsonBlock()` helpers |
| `src/lib/llm/generator.ts` | Two-phase generation orchestrator |
| `src/app/api/generate/book/route.ts` | Next.js route handler |
| `src/lib/llm/__tests__/utils.test.ts` | Property-based tests for utils |
| `src/lib/llm/__tests__/schema.test.ts` | Property-based tests for BookSchema |
| `vitest.config.ts` | Vitest config (points at `src/**/__tests__`) |

---

## Component Design

### `src/lib/llm/utils.ts`

```ts
/** Convert any string to a URL-safe slug. */
export function slugify(text: string): string

/** Extract and parse a JSON object from an LLM response that may wrap it in
 *  ```json ... ``` code fences. Returns null on any failure. */
export function extractJsonBlock(raw: string): unknown | null
```

Both are pure functions with no I/O — ideal for property testing.

---

### `src/lib/llm/bedrock.ts`

```ts
export class BedrockProvider {
  constructor()   // reads env vars, throws if AWS_REGION missing
  async invoke(prompt: string): Promise<string>
}
```

Internally uses `BedrockRuntimeClient` + `InvokeModelCommand` from
`@aws-sdk/client-bedrock-runtime`. Sends a Claude Messages API payload
(`anthropic_version`, `max_tokens`, `messages`). Returns the raw text of the
first content block.

---

### `src/lib/llm/generator.ts`

```ts
export interface GenerateBookInput {
  description: string   // plain-text user prompt
}

export class BookGeneratorService {
  constructor(provider: BedrockProvider)

  async generate(input: GenerateBookInput): Promise<BookJson>
  // Orchestrates: idempotency check → index generation → chapter loop →
  //               Zod validation → file write → upsertBook
}
```

#### Phase 1 — Index prompt

```
You are a professional author. Based on the following description, produce a
book index as a JSON object inside ```json ... ``` fences.

Description: <user description>

The JSON must conform to this TypeScript type:
{
  id: string,          // URL-safe slug derived from title
  title: string,
  author: string,
  genre: string[],
  description: string,
  coverImage: string,  // leave ""
  language: string,    // e.g. "en"
  publishedYear: number,
  chapters: Array<{ id: number, title: string }>  // 5–12 chapters, no content
}
Return ONLY the JSON block, no other text.
```

#### Phase 2 — Chapter content prompt (per chapter)

```
You are writing chapter <id>: "<title>" of the book "<bookTitle>" by <author>.

Book synopsis: <description>

Full chapter list:
<numbered list of all chapter titles>

Write the complete content for this chapter. Aim for 800–1500 words. Return
only the chapter text, no JSON, no headings, no "Chapter X:" prefix.
```

The service stores the returned string directly as `chapter.content`.

#### Idempotency check

Before making any Bedrock call, `generator.ts` checks whether
`<BOOKS_DATA_DIR>/<slugify(title)>.json` already exists on disk. If so, it
throws `BookAlreadyExistsError`.

#### Atomic write

The file is written only after all chapters are assembled and the full object
passes `BookSchema.safeParse()`. No partial writes occur.

---

### `src/app/api/generate/book/route.ts`

```ts
export async function POST(request: NextRequest): Promise<NextResponse>
```

1. Parse + validate body (`description` must be non-empty string).
2. Construct `BookGeneratorService`.
3. Call `generate({ description })`.
4. On success → `201` with `{ book: BookRecord }`.
5. On `BookAlreadyExistsError` → `409`.
6. On validation / generation error → `500`.

---

## Dependencies to Add

```bash
npm install @aws-sdk/client-bedrock-runtime
npm install --save-dev vitest fast-check @vitest/coverage-v8
```

- `@aws-sdk/client-bedrock-runtime` — AWS Bedrock inference calls
- `vitest` — test runner (native ESM / TypeScript, no extra transpile config)
- `fast-check` — property-based testing arbitraries
- `@vitest/coverage-v8` — optional, for coverage reporting

---

## Environment Variables (additions to `.env.local`)

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

---

## Data Flow Diagram

```
User → POST /api/generate/book { description }
          │
          ├─ [400] description missing
          │
          ├─ Idempotency check (file exists?)
          │       └─ [409] already exists
          │
          ├─ Bedrock Call 1: generate index JSON
          │       parse via extractJsonBlock()
          │       derive id via slugify(title)
          │
          ├─ for each chapter (sequential):
          │       Bedrock Call N: generate chapter content
          │       append content to chapter object
          │
          ├─ BookSchema.safeParse(assembled book)
          │       └─ [500] validation failed
          │
          ├─ fs.writeFileSync(data/books/<id>.json)
          ├─ upsertBook(...)
          │
          └─ [201] { book: BookRecord }
```

---

## Property-Based Test Plan

### `src/lib/llm/__tests__/utils.test.ts`

Uses `fc.string()`, `fc.unicodeString()`, `fc.constant("")` arbitraries.

| Property | Arbitrary | Assertion |
|----------|-----------|-----------|
| Output is lowercase | `fc.string()` | `output === output.toLowerCase()` |
| Only `[a-z0-9-]` chars | `fc.string()` | `/^[a-z0-9-]*$/.test(output)` |
| No leading/trailing `-` | `fc.string()` | `!output.startsWith('-') && !output.endsWith('-')` |
| Empty input → `"untitled"` | `fc.constant("")` | `output === "untitled"` |
| Pure | `fc.string()` | `slugify(s) === slugify(s)` |
| Valid JSON block extracted | build strings with ` ```json{...}``` ` | `extractJsonBlock(s) !== null` |
| No-fence string → null | `fc.string()` (no fence) | `extractJsonBlock(s) === null` |
| Malformed JSON → null | fence with non-JSON content | result is `null`, no throw |

### `src/lib/llm/__tests__/schema.test.ts`

Uses `fc.record()` with constrained arbitraries to build valid `BookJson`
objects and intentionally invalid ones.

| Property | Input | Expected |
|----------|-------|----------|
| Valid book passes | arbitrary valid `BookJson` | `safeParse().success === true` |
| Blank title fails | `title: ""` | `safeParse().success === false` |
| Empty chapters fails | `chapters: []` | `safeParse().success === false` |
| Non-positive chapter id fails | `id: 0` or negative | `safeParse().success === false` |
| Blank chapter title fails | `title: ""` in chapter | `safeParse().success === false` |
