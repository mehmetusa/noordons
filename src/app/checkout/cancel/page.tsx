import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Checkout Canceled | Noordons Books",
  description: "Stripe checkout was canceled and your cart is still available.",
};

export default function CheckoutCancelPage() {
  return (
    <main className="page-frame">
      <section className="section-panel px-6 py-10 sm:px-8">
        <p className="section-kicker">Checkout canceled</p>
        <h1 className="mt-4 font-serif text-5xl leading-none text-[#1b140f] sm:text-6xl">
          Your cart is still waiting.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-[#5d493d]">
          Stripe returned you without taking payment. Review the cart, adjust
          quantities, and try checkout again whenever you are ready.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/cart" className="btn-primary">
            Back to cart
          </Link>
          <Link href="/books" className="btn-secondary">
            Keep shopping
          </Link>
        </div>
      </section>
    </main>
  );
}
