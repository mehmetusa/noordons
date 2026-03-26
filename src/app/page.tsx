import Link from "next/link";

import { BookCard } from "@/components/book-card";
import { BookCover } from "@/components/book-cover";
import { SectionHeading } from "@/components/section-heading";
import { featuredShelves, serviceHighlights } from "@/data/sample-books";
import { getBooks } from "@/lib/books";
import { formatCompactNumber, formatCurrency } from "@/lib/format";
import { buildStoreStats } from "@/lib/store-stats";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allBooks = await getBooks();
  const featuredBooks = allBooks.filter((book) => book.featured).slice(0, 4);
  const latestBooks = allBooks.slice(0, 6);
  const spotlightBook = featuredBooks[0] ?? latestBooks[0];
  const dynamicStoreStats = buildStoreStats(allBooks);

  return (
    <main className="page-frame space-y-10">
      <section className="section-panel relative overflow-hidden px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="hero-orb hero-orb--left" />
        <div className="hero-orb hero-orb--right" />

        <div className="relative grid gap-10 lg:grid-cols-[1.18fr_0.82fr] lg:items-center">
          <div>
            <p className="section-kicker">Online bookstore</p>
            <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-none tracking-tight text-[#1a1410] sm:text-6xl lg:text-[5.4rem]">
              Build a reading life with shelves that feel hand-packed.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#594539] sm:text-lg">
              Noordons Books is designed like a premium independent bookshop:
              editorial curation up front, tactile product storytelling, and a
              catalog structure that can run on live MongoDB data when you are
              ready to launch.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/books" className="btn-primary">
                Browse all books
              </Link>
              <a href="#editorial-picks" className="btn-secondary">
                View staff picks
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {dynamicStoreStats.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <p className="font-serif text-4xl leading-none text-[#1b140f]">
                    {stat.value}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.26em] text-[#8d6246]">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#5d493d]">
                    {stat.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {spotlightBook ? (
            <aside className="rounded-[1.75rem] bg-[#1c1511] p-5 text-[#f6ede4] shadow-[0_28px_70px_rgba(39,27,20,0.26)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-kicker !text-[#d7af90]">Spotlight title</p>
                  <h2 className="mt-2 font-serif text-4xl leading-none text-white">
                    {spotlightBook.title}
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#f2d8c3]">
                  {formatCompactNumber(spotlightBook.reviewCount)} readers
                </span>
              </div>

              <BookCover
                title={spotlightBook.title}
                author={spotlightBook.author}
                palette={spotlightBook.palette}
                imageUrl={spotlightBook.imageUrl}
                badge={spotlightBook.badge}
                className="mt-5 h-[420px]"
              />

              <p className="mt-5 text-sm leading-7 text-[#e0cabc]">
                {spotlightBook.description}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.25rem] border border-white/10 bg-white/6 p-4">
                  <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-[#d7af90]">
                    Format
                  </p>
                  <p className="mt-3 text-lg">{spotlightBook.format}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/6 p-4">
                  <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-[#d7af90]">
                    Price
                  </p>
                  <p className="mt-3 text-lg">{formatCurrency(spotlightBook.price)}</p>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {featuredShelves.map((shelf) => (
          <Link
            key={shelf.title}
            href={shelf.href}
            className="section-panel group overflow-hidden p-5"
            style={{ backgroundImage: shelf.gradient }}
          >
            <p className="section-kicker !text-[#2d221b]">{shelf.eyebrow}</p>
            <h2 className="mt-3 font-serif text-4xl leading-none tracking-tight text-[#1f1712] transition-transform duration-200 group-hover:translate-x-1">
              {shelf.title}
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#2f241d]">
              {shelf.description}
            </p>
            <p className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#3a2a22]">
              {shelf.note}
            </p>
          </Link>
        ))}
      </section>

      <section id="editorial-picks" className="space-y-6">
        <SectionHeading
          eyebrow="Editorial picks"
          title="Featured books with enough texture to sell themselves."
          description="The home page leads with strong cover treatments, clear positioning, and a premium cadence rather than generic commerce blocks."
          actionHref="/books"
          actionLabel="Open catalog"
        />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featuredBooks.map((book) => (
            <BookCard key={book.slug} book={book} />
          ))}
        </div>
      </section>

      <section className="section-panel px-6 py-7 sm:px-8">
        <SectionHeading
          eyebrow="Store advantages"
          title="Structured like a real online bookstore, not a landing page."
          description="The UI supports catalog filtering, rich product pages, and JSON endpoints while keeping the front-end language warm and editorial."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {serviceHighlights.map((highlight) => (
            <div key={highlight.title} className="stat-card">
              <h3 className="font-serif text-3xl leading-none text-[#1b140f]">
                {highlight.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[#5d493d]">
                {highlight.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Fresh in the catalog"
          title="Recent additions that keep the store from feeling static."
          description="These cards can be driven entirely from MongoDB, but the sample data also makes local development predictable."
        />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {latestBooks.slice(0, 6).map((book) => (
            <BookCard key={book.slug} book={book} />
          ))}
        </div>
      </section>
    </main>
  );
}
