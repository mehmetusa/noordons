import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-frame">
      <section className="section-panel px-6 py-14 text-center sm:px-8">
        <p className="section-kicker">404</p>
        <h1 className="mt-4 font-serif text-5xl leading-none text-[#1b140f] sm:text-6xl">
          That title is missing from the shelf.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#5d493d]">
          The route exists, but the book slug did not match anything in the
          current catalog source.
        </p>
        <div className="mt-6">
          <Link href="/books" className="btn-primary">
            Back to catalog
          </Link>
        </div>
      </section>
    </main>
  );
}
