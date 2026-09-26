# Requirements Document

## Introduction

This document specifies requirements for the Book Generation UI feature of the
BookGen application. The feature adds a `/generate` page and a `GenerateForm`
client component that lets users describe a book in plain text and trigger
AI-powered book generation via the existing `POST /api/generate/book` endpoint.
Requirements are derived from the approved design document.

---

## Glossary

- **GenerateForm**: The client-side React component (`src/components/generate/GenerateForm.tsx`) that owns the description textarea, submit button, loading state, error display, and success card.
- **Generate_Page**: The Next.js server component page at `src/app/generate/page.tsx` that wraps `GenerateForm`.
- **Navbar**: The existing sticky header component at `src/components/ui/Navbar.tsx`.
- **Description**: The user-supplied plain-text string that describes the book to generate.
- **BookRecord**: The object returned by the API on successful generation, containing at minimum `id` and `title`.
- **SuccessCard**: The inline UI element rendered inside `GenerateForm` after successful generation.
- **Status**: The internal state of `GenerateForm` — one of `idle`, `loading`, `success`, or `error`.

---

## Requirements

### Requirement 1: Description Input and Client-Side Validation

**User Story:** As a user, I want to type a book description and have the form tell me when it is long enough to submit, so that I don't waste time on obviously incomplete prompts.

#### Acceptance Criteria

1. THE `GenerateForm` SHALL render a `<textarea>` for the description input with a placeholder that hints at the minimum length.
2. WHEN the trimmed length of the description is less than 20 characters, THE `GenerateForm` SHALL keep the submit button disabled.
3. WHEN the trimmed length of the description reaches 20 or more characters, THE `GenerateForm` SHALL enable the submit button.
4. THE `GenerateForm` SHALL display a character counter showing the current length relative to the 20-character minimum.

---

### Requirement 2: Loading State and Long-Wait Feedback

**User Story:** As a user, I want clear feedback that generation is in progress and may take a while, so that I don't think the page is broken and navigate away.

#### Acceptance Criteria

1. WHEN the user submits the form, THE `GenerateForm` SHALL immediately disable the textarea and the submit button and display a loading spinner.
2. WHILE `status` is `loading`, THE `GenerateForm` SHALL display the label "Generating your book… This can take a minute or two."
3. WHILE `status` is `loading`, THE `GenerateForm` SHALL keep the textarea and submit button disabled until a response is received.

---

### Requirement 3: Success State

**User Story:** As a user, I want to see the generated book's title and a direct link to start reading, so that I can immediately access my new book.

#### Acceptance Criteria

1. WHEN the API returns a 201 response, THE `GenerateForm` SHALL transition `status` to `success` and store the returned `BookRecord`.
2. WHEN `status` is `success`, THE `GenerateForm` SHALL render the `SuccessCard` displaying the book title.
3. WHEN `status` is `success`, THE `SuccessCard` SHALL render a "Read Now →" link that navigates to `/read/<book.id>/1`.
4. WHEN `status` is `success`, THE `SuccessCard` SHALL render a "Generate another" button that resets `status` to `idle` and clears the description.

---

### Requirement 4: Error Handling

**User Story:** As a user, I want clear, actionable error messages when generation fails, so that I know what went wrong and how to proceed.

#### Acceptance Criteria

1. WHEN the API returns a 400 response, THE `GenerateForm` SHALL display the error message from the API response body below the textarea.
2. WHEN the API returns a 409 response, THE `GenerateForm` SHALL display "A book with that title already exists. Try a different description."
3. WHEN the API returns a 5xx response or the network request fails, THE `GenerateForm` SHALL display "Generation failed. Please try again."
4. WHEN `status` is `error`, THE `GenerateForm` SHALL re-enable the textarea and the submit button so the user can retry.
5. IF an error state is displayed, THEN THE `GenerateForm` SHALL render the error message in a visually distinct style (red/destructive text) that does not rely on color alone.

---

### Requirement 5: `/generate` Page

**User Story:** As a user, I want a dedicated page to access the book generation feature, so that I can navigate to it directly.

#### Acceptance Criteria

1. THE `Generate_Page` SHALL render a page heading "Generate a Book".
2. THE `Generate_Page` SHALL render a short subtitle beneath the heading.
3. THE `Generate_Page` SHALL render the `GenerateForm` component below the heading and subtitle.
4. THE `Generate_Page` SHALL apply the standard page wrapper (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10`) consistent with other pages in the application.

---

### Requirement 6: Navbar Navigation Link

**User Story:** As a user, I want a "Generate" link in the top navigation, so that I can reach the generation page from anywhere in the app.

#### Acceptance Criteria

1. THE `Navbar` SHALL render a "Generate" link that navigates to `/generate`.
2. THE `Navbar` SHALL position the "Generate" link between the "Catalog" link and the theme-toggle button.
3. THE `Navbar` SHALL style the "Generate" link consistently with the existing "Catalog" link (same font size, weight, and hover behaviour).

---

### Requirement 7: Accessibility

**User Story:** As a user relying on assistive technology, I want the generation form to be fully keyboard-navigable and screen-reader-friendly, so that I can use it without a mouse.

#### Acceptance Criteria

1. THE `GenerateForm` SHALL associate a visible `<label>` with the description `<textarea>` using `htmlFor` / `id` pairing.
2. THE `GenerateForm` SHALL render the submit button as a native `<button type="submit">` element.
3. WHEN `status` is `loading`, THE `GenerateForm` SHALL set `aria-busy="true"` on the submit button.
4. WHEN `status` is `error`, THE `GenerateForm` SHALL render the error message in an element with `role="alert"` so screen readers announce it automatically.
5. THE `SuccessCard` "Read Now →" link SHALL have a descriptive `aria-label` that includes the book title (e.g., `"Read <title> now"`).
