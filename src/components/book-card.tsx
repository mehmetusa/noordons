import Link from "next/link";

import { BookCover } from "@/components/book-cover";
import { formatCurrency } from "@/lib/format";
import type { Book } from "@/types/book";

type BookCardProps = {
  book: Book;
};

export function BookCard({ book }: BookCardProps) {
  return (
    <article className="shelf-card">
      <Link href={`/books/${book.slug}`} className="flex h-full flex-col gap-4">
        <BookCover
          title={book.title}
          author={book.author}
          palette={book.palette}
          imageUrl={book.imageUrl}
          badge={book.badge}
          className="h-[320px] sm:h-[340px]"
        />

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker">{book.genre}</p>
              <h3 className="mt-2 font-serif text-3xl leading-none tracking-tight text-[#1b140f]">
                {book.title}
              </h3>
              <p className="mt-2 text-sm text-[#6b584d]">by {book.author}</p>
            </div>
            <span className="price-chip">{formatCurrency(book.price)}</span>
          </div>

          <p className="text-sm leading-7 text-[#5f4a3f]">{book.description}</p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7e6455]">
          <span className="pill">{book.format}</span>
          <span className="pill">
            {book.rating > 0 ? `${book.rating.toFixed(1)} rating` : "Unrated"}
          </span>
          <span className="pill">
            {book.reviewCount > 0 ? `${book.reviewCount} reviews` : "New listing"}
          </span>
        </div>
      </Link>
    </article>
  );
}
