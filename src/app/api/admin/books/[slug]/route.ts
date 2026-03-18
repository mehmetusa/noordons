import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getBookBySlug, updateBookBySlug, deleteBookBySlug } from "@/lib/books";
import { parseAdminBookInput } from "@/lib/admin-book-form";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

async function requireAdmin() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json(
      { message: "Admin access required." },
      { status: 403 },
    );
  }

  return null;
}

export async function PUT(request: Request, context: RouteContext) {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const { slug } = await context.params;
  const existingBook = await getBookBySlug(slug);

  if (!existingBook) {
    return NextResponse.json({ message: "Book not found." }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const updatedBook = await updateBookBySlug(
      slug,
      await parseAdminBookInput(formData, {
        existingImageUrl: existingBook.imageUrl,
      }),
    );

    revalidatePath("/");
    revalidatePath("/books");
    revalidatePath(`/books/${slug}`);
    revalidatePath(`/books/${updatedBook.slug}`);
    revalidatePath("/admin");

    return NextResponse.json({
      message: `${updatedBook.title} updated successfully.`,
      slug: updatedBook.slug,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update book.";

    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const { slug } = await context.params;

  try {
    const deletedBook = await deleteBookBySlug(slug);

    revalidatePath("/");
    revalidatePath("/books");
    revalidatePath(`/books/${slug}`);
    revalidatePath("/admin");

    return NextResponse.json({
      message: `${deletedBook.title} deleted from the catalog.`,
      slug: deletedBook.slug,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete book.";

    return NextResponse.json({ message }, { status: 400 });
  }
}
