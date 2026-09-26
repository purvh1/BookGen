# Product: BookGen

BookGen is a free online book reader. Users can browse a catalog of classic/public-domain books, read them chapter by chapter, and personalize their reading experience.

## Core Features
- **Catalog** – Browse and search available books with cover art, author, genre, and description.
- **Reader** – Chapter-by-chapter reading view with scroll-position persistence.
- **Progress tracking** – Automatically saves the user's last chapter and scroll offset per book.
- **Bookmarks** – Users can bookmark specific chapters with an optional label.
- **Annotations** – Users can highlight text passages within a chapter and attach notes.
- **Auth** – Email/password registration and login; session managed via an httpOnly JWT cookie.

## Content Model
Books are ingested from JSON files placed in `data/books/`. Each file must conform to the `BookSchema` (id, title, author, genre[], description, coverImage, language, publishedYear, chapters[]). The server loads them on startup via the Next.js instrumentation hook and indexes them into SQLite.
