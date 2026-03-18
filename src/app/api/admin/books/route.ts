import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { parseAdminBookInput } from "@/lib/admin-book-form";
import { createBook } from "@/lib/books";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const createdBook = await createBook(await parseAdminBookInput(formData));

    revalidatePath("/");
    revalidatePath("/books");
    revalidatePath(`/books/${createdBook.slug}`);
    revalidatePath("/admin");

    return NextResponse.json({
      message: `${createdBook.title} added to the catalog.`,
      slug: createdBook.slug,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create book.";

    return NextResponse.json({ message }, { status: 400 });
  }
}
