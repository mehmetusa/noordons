import { NextResponse } from "next/server";

import { getBookBySlug } from "@/lib/books";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { slug } = await context.params;
  const book = await getBookBySlug(slug);

  if (!book) {
    return NextResponse.json(
      { message: "Book not found." },
      { status: 404 },
    );
  }

  return NextResponse.json(book);
}
