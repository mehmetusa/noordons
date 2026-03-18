import { NextResponse } from "next/server";

import { getBooks } from "@/lib/books";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q") ?? undefined;
  const genre = searchParams.get("genre") ?? undefined;
  const featured = searchParams.get("featured") === "true";
  const limitValue = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(limitValue) && limitValue > 0 ? limitValue : undefined;

  const books = await getBooks({
    query,
    genre,
    featured,
    limit,
  });

  return NextResponse.json({
    count: books.length,
    data: books,
  });
}
