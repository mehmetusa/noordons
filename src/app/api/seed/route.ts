import { NextResponse } from "next/server";

import { seedBooks } from "@/lib/books";

export async function POST() {
  try {
    const result = await seedBooks();

    return NextResponse.json({
      message: result.seeded
        ? "Catalog seeded successfully."
        : "Catalog already contains books.",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown seed error.";

    return NextResponse.json({ message }, { status: 400 });
  }
}
