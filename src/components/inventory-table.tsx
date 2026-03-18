"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";

import { AdminBookEditForm } from "@/components/admin-book-edit-form";
import { BookCover } from "@/components/book-cover";
import { formatCurrency } from "@/lib/format";
import type { Book } from "@/types/book";

type InventoryTableProps = {
  books: Book[];
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 25;

function getStockLabel(inventory: number) {
  if (inventory <= 0) {
    return { label: "Out", className: "pill !bg-[#fff1ee] !text-[#8f443f]" };
  }

  if (inventory <= 10) {
    return { label: "Low", className: "pill !bg-[#fff6df] !text-[#8a6521]" };
  }

  return { label: "Healthy", className: "pill !bg-[#edf9f0] !text-[#2f6b44]" };
}

function getVisiblePages(currentPage: number, pageCount: number) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, pageCount];
  }

  if (currentPage >= pageCount - 3) {
    return [1, pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }

  return [1, currentPage - 1, currentPage, currentPage + 1, pageCount];
}

export function InventoryTable({
  books,
  pageSize = DEFAULT_PAGE_SIZE,
}: InventoryTableProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [pendingDeleteSlug, setPendingDeleteSlug] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const pageCount = Math.max(1, Math.ceil(books.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const pageStartIndex = (safePage - 1) * pageSize;
  const pageBooks = books.slice(pageStartIndex, pageStartIndex + pageSize);
  const visiblePages = getVisiblePages(safePage, pageCount);
  const rangeStart = books.length ? pageStartIndex + 1 : 0;
  const rangeEnd = pageStartIndex + pageBooks.length;

  async function handleDelete(book: Book) {
    if (
      !window.confirm(`Delete "${book.title}" from the catalog? This cannot be undone.`)
    ) {
      return;
    }

    setPendingDeleteSlug(book.slug);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/admin/books/${encodeURIComponent(book.slug)}`,
        {
          method: "DELETE",
        },
      );
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to delete book.");
      }

      if (editingSlug === book.slug) {
        setEditingSlug(null);
      }

      setFeedback({
        type: "success",
        message: payload.message || `${book.title} deleted from the catalog.`,
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to delete book.",
      });
    } finally {
      setPendingDeleteSlug(null);
    }
  }

  return (
    <section className="section-panel overflow-hidden px-0 py-0">
      <div className="border-b border-black/10 px-6 py-6 sm:px-7">
        <p className="section-kicker">Product inventory</p>
        <h2 className="mt-3 font-serif text-4xl leading-none text-[#1b140f]">
          Live stock across the catalog.
        </h2>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-[#5d493d]">
          <p>
            Showing {rangeStart}-{rangeEnd} of {books.length} titles.
          </p>
          {books.length > pageSize ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn-secondary !px-4 !py-2"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage === 1}
              >
                Previous
              </button>

              {visiblePages.map((page, index) => {
                const previousPage = visiblePages[index - 1];
                const shouldShowGap = previousPage && page - previousPage > 1;

                return (
                  <div key={page} className="flex items-center gap-2">
                    {shouldShowGap ? (
                      <span className="px-1 text-[#8b6d5a]">...</span>
                    ) : null}
                    <button
                      type="button"
                      className={
                        page === safePage
                          ? "pill !bg-[#1b1511] !text-[#f3e8dd]"
                          : "pill"
                      }
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                className="btn-secondary !px-4 !py-2"
                onClick={() =>
                  setCurrentPage((page) => Math.min(pageCount, page + 1))
                }
                disabled={safePage === pageCount}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
        {feedback ? (
          <p
            className={`mt-3 text-sm leading-7 ${
              feedback.type === "success" ? "text-[#3b6f4e]" : "text-[#8f443f]"
            }`}
          >
            {feedback.message}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="border-b border-black/10 bg-white/35 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#8b6d5a]">
            <tr>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Featured</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageBooks.length ? pageBooks.map((book) => {
              const stock = getStockLabel(book.inventory);
              const isEditing = editingSlug === book.slug;

              return (
                <Fragment key={book.slug}>
                  <tr key={book.slug} className="border-b border-black/8">
                    <td className="px-6 py-4">
                      <div className="flex min-w-[280px] items-center gap-4">
                        <BookCover
                          title={book.title}
                          author={book.author}
                          palette={book.palette}
                          imageUrl={book.imageUrl}
                          badge={book.badge}
                          className="h-28 w-20 shrink-0 rounded-[1rem]"
                        />
                        <div>
                          <p className="font-serif text-2xl leading-none text-[#1b140f]">
                            {book.title}
                          </p>
                          <p className="mt-2 text-sm text-[#5d493d]">
                            {book.author}
                          </p>
                          <p className="mt-1 text-sm text-[#8b6d5a]">
                            {book.genre} / {book.format}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#5d493d]">
                      <Link href={`/books/${book.slug}`} className="nav-link">
                        {book.slug}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1b140f]">
                      {formatCurrency(book.price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1b140f]">
                      {book.inventory}
                    </td>
                    <td className="px-6 py-4">
                      <span className={stock.className}>{stock.label}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#5d493d]">
                      {book.featured ? "Yes" : "No"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() =>
                            setEditingSlug((current) =>
                              current === book.slug ? null : book.slug,
                            )
                          }
                        >
                          {isEditing ? "Close" : "Edit"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary !border-[#b36c61]/40 !text-[#8f443f]"
                          onClick={() => handleDelete(book)}
                          disabled={pendingDeleteSlug === book.slug}
                        >
                          {pendingDeleteSlug === book.slug ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isEditing ? (
                    <tr className="border-b border-black/8 last:border-b-0">
                      <td colSpan={7} className="px-6 py-5">
                        <AdminBookEditForm
                          book={book}
                          onCancel={() => setEditingSlug(null)}
                          onSaved={(message) => {
                            setEditingSlug(null);
                            setFeedback({
                              type: "success",
                              message,
                            });
                          }}
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            }) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-sm leading-7 text-[#5d493d]">
                  No products are in the database yet. Use the form above to add the
                  first book with its cover image and inventory count.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
