import { NextRequest, NextResponse } from "next/server";
import { BedrockProvider } from "@/lib/llm/bedrock";
import { BookGeneratorService, BookAlreadyExistsError } from "@/lib/llm/generator";
import { getBookById } from "@/lib/db/repositories/books";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "description is required" },
      { status: 400 }
    );
  }

  const description =
    body !== null &&
    typeof body === "object" &&
    "description" in body
      ? (body as { description: unknown }).description
      : undefined;

  if (typeof description !== "string" || description.trim() === "") {
    return NextResponse.json(
      { error: "description is required" },
      { status: 400 }
    );
  }

  try {
    const provider = new BedrockProvider();
    const generator = new BookGeneratorService(provider);

    const generatedBook = await generator.generate({ description });

    const book = getBookById(generatedBook.id);

    return NextResponse.json({ book }, { status: 201 });
  } catch (err) {
    if (err instanceof BookAlreadyExistsError) {
      return NextResponse.json(
        { error: "Book already exists" },
        { status: 409 }
      );
    }

    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/generate/book] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
