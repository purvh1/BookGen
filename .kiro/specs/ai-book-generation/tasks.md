# Tasks: AI Book Generation via AWS Bedrock

## Task 1 — Install Dependencies & Configure Vitest

Install the AWS Bedrock SDK and test tooling, then wire up a `vitest.config.ts`
and add `test` and `test:coverage` scripts to `package.json`.

- Install `@aws-sdk/client-bedrock-runtime` (runtime dependency)
- Install `vitest`, `fast-check`, `@vitest/coverage-v8` (dev dependencies)
- Create `vitest.config.ts` at the project root with TypeScript path aliases
  (`@/` → `./src/`) matching `tsconfig.json`
- Add `"test": "vitest --run"` and `"test:coverage": "vitest --run --coverage"`
  to `package.json` scripts
- Add the four new env vars to `.env.local` (with placeholder values)

---

## Task 2 — Implement LLM Utilities (`src/lib/llm/utils.ts`)

Create the two pure helper functions.

- `slugify(text: string): string`
  - Lowercases, strips non-alphanumeric chars (keep spaces), replaces spaces
    with `-`, collapses multiple `-`, trims leading/trailing `-`
  - Returns `"untitled"` for blank/whitespace-only input
- `extractJsonBlock(raw: string): unknown | null`
  - Finds first ` ```json\n...\n``` ` block in `raw` via regex
  - Attempts `JSON.parse()` on the captured content
  - Returns the parsed value on success, `null` on any failure (no throws)

---

## Task 3 — Implement Bedrock Provider (`src/lib/llm/bedrock.ts`)

Wrap `@aws-sdk/client-bedrock-runtime` in a minimal, testable class.

- Read `AWS_REGION`, `BEDROCK_MODEL_ID` from env in constructor; throw if either
  is missing
- Create `BedrockRuntimeClient` with region + optional static credentials
  (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`)
- `invoke(prompt)` sends `InvokeModelCommand` with a Claude Messages API payload
  (`anthropic_version: "bedrock-2023-05-31"`, `max_tokens: 8096`,
  `messages: [{ role: "user", content: prompt }]`)
- Parse the response body (Uint8Array → JSON → first content block text)
- Re-throw any SDK error with the original message preserved

---

## Task 4 — Implement Book Generator Service (`src/lib/llm/generator.ts`)

Orchestrate the two-phase generation pipeline.

- Export `BookAlreadyExistsError extends Error`
- `BookGeneratorService.generate(input)`:
  1. Check for existing file; throw `BookAlreadyExistsError` if found
  2. Build and send the index prompt; parse response with `extractJsonBlock`;
     set `id` from `slugify(title)`, `coverImage` to `""`
  3. Loop over chapter stubs sequentially; build per-chapter prompt (includes
     book synopsis + full chapter list for context); call `provider.invoke()`;
     attach returned text as `chapter.content`
  4. Validate assembled object with `BookSchema.safeParse()`; throw on failure
  5. Resolve output path from `BOOKS_DATA_DIR`; write JSON synchronously
  6. Call `upsertBook()` with `filePath` set to the resolved absolute path
  7. Return the assembled `BookJson`

---

## Task 5 — Implement API Route (`src/app/api/generate/book/route.ts`)

Expose the generator over HTTP.

- `POST` handler:
  - Parse JSON body; return `400` if `description` is absent or empty
  - Instantiate `BedrockProvider` and `BookGeneratorService`
  - Call `generator.generate({ description })`
  - Map `BookAlreadyExistsError` → `409 { error: "Book already exists" }`
  - Map any other error → `500 { error: err.message }`
  - On success → `201` with `{ book: getBookById(generatedBook.id) }`

---

## Task 6 — Write Property-Based Tests

Create two test files and verify they pass with `npm test`.

**`src/lib/llm/__tests__/utils.test.ts`** — test `slugify` and `extractJsonBlock`:
- 5 `slugify` properties (lowercase, charset, no boundary dashes, empty input,
  purity) using `fc.string()` / `fc.unicodeString()`
- 3 `extractJsonBlock` properties (valid fence parsed, no fence → null,
  malformed JSON → null)

**`src/lib/llm/__tests__/schema.test.ts`** — test `BookSchema` round-trips:
- Build a valid `BookJson` arbitrary with `fc.record()` + constrained fields
- Assert `.safeParse().success === true` for all valid arbitrary inputs
- Assert `.success === false` for blank title, empty chapters array,
  chapter `id` ≤ 0, blank chapter title
