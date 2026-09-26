import { notFound } from "next/navigation";
import ReaderLayout from "@/components/reader/ReaderLayout";

interface ChapterStub {
  id: number;
  title: string;
}

interface BookMetaResponse {
  id: string;
  title: string;
  author: string;
  genre: string[];
  description: string;
  coverImage: string;
  language: string;
  publishedYear: number;
  chapters: ChapterStub[];
}

interface ChapterResponse {
  chapter: {
    id: number;
    title: string;
    content: string;
  };
}

interface ReaderPageProps {
  params: {
    bookId: string;
    chapterId: string;
  };
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`
  );
}

async function fetchBookMeta(bookId: string): Promise<BookMetaResponse | null> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/books/${bookId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<BookMetaResponse>;
  } catch {
    return null;
  }
}

async function fetchChapter(
  bookId: string,
  chapterId: number
): Promise<ChapterResponse["chapter"] | null> {
  try {
    const res = await fetch(
      `${getBaseUrl()}/api/books/${bookId}/chapters/${chapterId}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as ChapterResponse;
    return data.chapter ?? null;
  } catch {
    return null;
  }
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { bookId, chapterId: chapterIdParam } = params;
  const chapterId = parseInt(chapterIdParam, 10);

  if (isNaN(chapterId)) {
    notFound();
  }

  const [bookMeta, chapterData] = await Promise.all([
    fetchBookMeta(bookId),
    fetchChapter(bookId, chapterId),
  ]);

  if (!bookMeta) {
    notFound();
  }
  if (!chapterData) {
    notFound();
  }

  return (
    <ReaderLayout
      bookId={bookMeta.id}
      bookTitle={bookMeta.title}
      chapters={bookMeta.chapters}
      currentChapterId={chapterId}
      chapter={chapterData}
    />
  );
}
