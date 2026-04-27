import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookCard } from "@/components/book-card";
import { BookCover } from "@/components/book-cover";
import { PurchaseActions } from "@/components/purchase-actions";
import { getBookBySlug, getBooks } from "@/lib/books";
import { formatCurrency } from "@/lib/format";

type BookDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: BookDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    return {
      title: "Book not found | Noordons Books",
    };
  }

  return {
    title: `${book.title} | Noordons Books`,
    description: book.description,
  };
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  const relatedBooks = (
    await getBooks({
      genre: book.genre,
      excludeSlug: book.slug,
      limit: 3,
    })
  ).slice(0, 3);

  return (
    <main className="page-frame space-y-8">
      <section className="section-panel px-6 py-8 sm:px-8">
        <div className="grid gap-8 xl:grid-cols-[0.78fr_1.1fr_0.72fr]">
          <BookCover
            title={book.title}
            author={book.author}
            palette={book.palette}
            imageUrl={book.imageUrl}
            badge={book.badge}
            className="h-[520px]"
          />

          <div>
            <p className="section-kicker">
              {book.genre} / {book.format}
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-none tracking-tight text-[#1b140f] sm:text-6xl">
              {book.title}
            </h1>
            <p className="mt-4 text-lg text-[#594539]">by {book.author}</p>

            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7e6455]">
              <span className="pill">
                {book.rating > 0 ? `${book.rating.toFixed(1)} rating` : "Unrated"}
              </span>
              <span className="pill">
                {book.reviewCount > 0 ? `${book.reviewCount} reviews` : "New listing"}
              </span>
              <span className="pill">{book.language}</span>
            </div>

            <p className="mt-6 max-w-2xl text-base leading-8 text-[#5d493d]">
              {book.description}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {book.highlights.map((highlight) => (
                <div key={highlight} className="stat-card">
                  <p className="text-sm leading-7 text-[#5d493d]">{highlight}</p>
                </div>
              ))}
            </div>

            <div className="prose-copy mt-8 space-y-4">
              {book.longDescription.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {book.tags.map((tag) => (
                <Link key={tag} href={`/books?q=${encodeURIComponent(tag)}`} className="btn-secondary">
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-black/10 bg-white/60 p-5 shadow-[0_16px_50px_rgba(55,39,28,0.08)]">
            <p className="section-kicker">Purchase</p>
            <div className="mt-4 flex items-end gap-3">
              <p className="font-serif text-5xl leading-none text-[#1b140f]">
                {formatCurrency(book.price)}
              </p>
              {book.compareAtPrice ? (
                <p className="pb-1 text-sm text-[#8b6d5a] line-through">
                  {formatCurrency(book.compareAtPrice)}
                </p>
              ) : null}
            </div>

            <div className="mt-6 space-y-3 text-sm leading-7 text-[#5d493d]">
              <p>{book.inventory} copies currently available.</p>
              <p>Gift-note friendly packaging and premium presentation are already baked into the product page.</p>
            </div>

            <PurchaseActions book={book} />

            <dl className="mt-8 space-y-4 border-t border-black/10 pt-6 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-[#8b6d5a]">Pages</dt>
                <dd className="text-right text-[#1b140f]">{book.pages}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-[#8b6d5a]">Published</dt>
                <dd className="text-right text-[#1b140f]">{book.publishedYear}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-[#8b6d5a]">ISBN</dt>
                <dd className="text-right text-[#1b140f]">{book.isbn}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {relatedBooks.length > 0 ? (
        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="section-kicker">Related shelf</p>
              <h2 className="mt-3 font-serif text-4xl leading-none text-[#1b140f]">
                More from the {book.genre} table.
              </h2>
            </div>
            <Link href={`/books?genre=${encodeURIComponent(book.genre)}`} className="btn-secondary">
              View all {book.genre}
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {relatedBooks.map((relatedBook) => (
              <BookCard key={relatedBook.slug} book={relatedBook} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
