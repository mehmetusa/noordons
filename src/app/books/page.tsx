import Link from "next/link";

import { BookCard } from "@/components/book-card";
import { SectionHeading } from "@/components/section-heading";
import { getBookCount, getBooks, getGenres } from "@/lib/books";

const CATALOG_PREVIEW_LIMIT = 120;

type BooksPageProps = {
  searchParams: Promise<{
    genre?: string;
    q?: string;
  }>;
};

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const genre = typeof params.genre === "string" ? params.genre : "All";

  const [books, totalCount, genres] = await Promise.all([
    getBooks({ query, genre, limit: CATALOG_PREVIEW_LIMIT }),
    getBookCount({ query, genre }),
    getGenres(),
  ]);

  const filters = ["All", ...genres];

  return (
    <main className="page-frame space-y-8">
      <section className="section-panel px-6 py-8 sm:px-8">
        <SectionHeading
          eyebrow="Catalog"
          title="A searchable shelf built for browsing and buying."
          description="Search by title, author, format, or category. The genre filter is server-rendered, compact, and easy to adjust while browsing."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form action="/books" className="space-y-4">
            {genre !== "All" ? <input type="hidden" name="genre" value={genre} /> : null}

            <div className="flex flex-col gap-3">
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search by title, author, or shelf"
                className="input-shell"
              />
              <button type="submit" className="btn-primary w-fit">
                Search catalog
              </button>
            </div>

            <p className="text-sm leading-7 text-[#5d493d]">
              {totalCount} result{totalCount === 1 ? "" : "s"} found
              {genre !== "All" ? ` in ${genre}` : ""}.
              {totalCount > books.length
                ? ` Showing the first ${books.length}.`
                : " All matching titles are shown."}
            </p>
          </form>

          <div className="rounded-[1.5rem] border border-black/10 bg-white/40 p-5">
            <p className="section-kicker">Filters</p>
            <form action="/books" className="mt-4 space-y-4">
              {query ? <input type="hidden" name="q" value={query} /> : null}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#5d493d]">
                  Browse by genre
                </span>
                <select
                  name="genre"
                  defaultValue={genre}
                  className="input-shell text-sm"
                >
                  {filters.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-3">
                <button type="submit" className="btn-primary">
                  Apply filter
                </button>
                <Link href={query ? `/books?q=${encodeURIComponent(query)}` : "/books"} className="btn-secondary">
                  Reset
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>

      {books.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => (
            <BookCard key={book.slug} book={book} />
          ))}
        </section>
      ) : (
        <section className="section-panel px-6 py-10 text-center sm:px-8">
          <p className="section-kicker">No matches</p>
          <h2 className="mt-3 font-serif text-4xl leading-none text-[#1b140f]">
            Nothing matched this search yet.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#5d493d]">
            Try a broader keyword or switch back to the full catalog. The page
            is already wired to handle real MongoDB inventory, so this state also
            works when your live catalog changes over time.
          </p>
          <div className="mt-6">
            <Link href="/books" className="btn-primary">
              Reset filters
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
