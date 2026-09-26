/**
 * Next.js instrumentation hook — runs once when the server starts.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only run the book loader in the Node.js runtime (not in Edge runtime).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { loadBooks } = await import("@/lib/books/loader");
    loadBooks();
  }
}
