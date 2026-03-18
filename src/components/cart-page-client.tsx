"use client";

import Link from "next/link";

import { BookCover } from "@/components/book-cover";
import { CheckoutButton } from "@/components/checkout-button";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/format";

type CartPageClientProps = {
  stripeReady: boolean;
  stripeConfigurationError?: string | null;
};

export function CartPageClient({
  stripeReady,
  stripeConfigurationError,
}: CartPageClientProps) {
  const {
    items,
    itemCount,
    subtotal,
    hasHydrated,
    removeBook,
    updateQuantity,
    clearCart,
  } = useCart();

  if (!hasHydrated) {
    return (
      <section className="section-panel px-6 py-10 sm:px-8">
        <p className="text-sm leading-7 text-[#5d493d]">Loading cart...</p>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="section-panel px-6 py-10 text-center sm:px-8">
        <p className="section-kicker">Your cart</p>
        <h2 className="mt-4 font-serif text-4xl leading-none text-[#1b140f] sm:text-5xl">
          No books added yet.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#5d493d]">
          Add a title from any product page and it will appear here. Checkout is
          wired for Stripe once your secret key is configured.
        </p>
        <div className="mt-6">
          <Link href="/books" className="btn-primary">
            Browse catalog
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-4">
        {items.map((item) => (
          <article key={item.slug} className="section-panel px-4 py-4 sm:px-5">
            <div className="grid gap-5 md:grid-cols-[180px_1fr]">
              <BookCover
                title={item.title}
                author={item.author}
                palette={item.palette}
                imageUrl={item.imageUrl}
                badge={item.badge}
                className="h-[240px]"
              />

              <div className="flex flex-col justify-between gap-4">
                <div>
                  <p className="section-kicker">{item.format}</p>
                  <h3 className="mt-2 font-serif text-4xl leading-none text-[#1b140f]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#6b584d]">by {item.author}</p>
                  <p className="mt-4 text-sm leading-7 text-[#5d493d]">
                    {formatCurrency(item.price)} each
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="quantity-picker">
                    <button
                      type="button"
                      className="quantity-picker__button"
                      onClick={() =>
                        updateQuantity(item.slug, Math.max(1, item.quantity - 1))
                      }
                    >
                      -
                    </button>
                    <span className="quantity-picker__value">{item.quantity}</span>
                    <button
                      type="button"
                      className="quantity-picker__button"
                      onClick={() =>
                        updateQuantity(
                          item.slug,
                          Math.min(item.inventory, item.quantity + 1),
                        )
                      }
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="price-chip">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => removeBook(item.slug)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <aside className="section-panel h-fit px-6 py-6 sm:px-7">
        <p className="section-kicker">Order summary</p>
        <h2 className="mt-3 font-serif text-4xl leading-none text-[#1b140f]">
          Ready for checkout.
        </h2>

        <dl className="mt-6 space-y-4 border-t border-black/10 pt-5 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[#8b6d5a]">Items</dt>
            <dd className="text-[#1b140f]">{itemCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[#8b6d5a]">Subtotal</dt>
            <dd className="text-[#1b140f]">{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[#8b6d5a]">Checkout</dt>
            <dd className="text-right text-[#1b140f]">Stripe hosted payment page</dd>
          </div>
        </dl>

        <div className="mt-6 space-y-4">
          <CheckoutButton
            items={items.map((item) => ({
              slug: item.slug,
              quantity: item.quantity,
            }))}
            disabled={!stripeReady}
            loginRedirectTo="/cart"
          />

          {stripeConfigurationError ? (
            <p className="text-sm leading-7 text-[#8f443f]">
              {stripeConfigurationError}
            </p>
          ) : null}

          <button type="button" className="btn-secondary w-full" onClick={clearCart}>
            Clear cart
          </button>
        </div>

        <p className="mt-6 text-sm leading-7 text-[#5d493d]">
          Prices and inventory are revalidated on the server before a Stripe
          session is created, so stale or tampered cart payloads will not pass.
        </p>
      </aside>
    </div>
  );
}
