import type { Metadata } from "next";
import Link from "next/link";

import { formatAddressLines } from "@/lib/address";
import { ClearCartOnSuccess } from "@/components/clear-cart-on-success";
import { formatCurrencyFromCents } from "@/lib/format";
import { syncOrderFromCheckoutSessionId } from "@/lib/orders";
import { getCheckoutSessionSummary } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Order Confirmed | Noordons Books",
  description: "Your Stripe checkout completed successfully.",
};

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  const [sessionSummary, orderSyncResult] = sessionId
    ? await Promise.all([
        getCheckoutSessionSummary(sessionId).catch(() => null),
        syncOrderFromCheckoutSessionId(sessionId).catch(() => null),
      ])
    : [null, null];
  const orderRecorded = Boolean(orderSyncResult);

  return (
    <main className="page-frame space-y-8">
      <ClearCartOnSuccess enabled={Boolean(sessionId)} />

      <section className="section-panel px-6 py-10 sm:px-8">
        <p className="section-kicker">Checkout complete</p>
        <h1 className="mt-4 font-serif text-5xl leading-none text-[#1b140f] sm:text-6xl">
          Thank you. Your order is confirmed.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-[#5d493d]">
          Stripe returned successfully and the bookstore cart has been cleared on
          this device.
        </p>

        {sessionId ? (
          <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-white/50 p-5">
            <p className="text-sm leading-7 text-[#5d493d]">
              {orderRecorded
                ? "This order has been saved to your dashboard."
                : "The payment succeeded, but dashboard sync is still waiting on MongoDB and Stripe webhook persistence."}
            </p>
          </div>
        ) : null}

        {sessionSummary ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <aside className="rounded-[1.5rem] border border-black/10 bg-white/50 p-5">
              <p className="section-kicker">Receipt summary</p>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#8b6d5a]">Session</dt>
                  <dd className="text-right text-[#1b140f]">{sessionSummary.id}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#8b6d5a]">Email</dt>
                  <dd className="text-right text-[#1b140f]">
                    {sessionSummary.customerEmail || "Provided at checkout"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#8b6d5a]">Payment status</dt>
                  <dd className="text-right text-[#1b140f]">
                    {sessionSummary.paymentStatus}
                  </dd>
                </div>
                {sessionSummary.invoiceId ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[#8b6d5a]">Invoice</dt>
                    <dd className="text-right text-[#1b140f]">
                      {sessionSummary.invoiceId}
                    </dd>
                  </div>
                ) : null}
                {sessionSummary.amountTotal !== null ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[#8b6d5a]">Total paid</dt>
                    <dd className="text-right text-[#1b140f]">
                      {formatCurrencyFromCents(sessionSummary.amountTotal)}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </aside>

            <div className="rounded-[1.5rem] border border-black/10 bg-white/50 p-5">
              <p className="section-kicker">Items</p>
              <div className="mt-5 space-y-4">
                {sessionSummary.items.map((item) => (
                  <div
                    key={`${item.title}-${item.quantity}`}
                    className="flex items-center justify-between gap-4 border-b border-black/10 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <h2 className="font-serif text-3xl leading-none text-[#1b140f]">
                        {item.title}
                      </h2>
                      <p className="mt-2 text-sm text-[#5d493d]">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <p className="price-chip">
                      {formatCurrencyFromCents(item.amountTotal)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-[1.5rem] border border-black/10 bg-white/50 p-5">
            <p className="text-sm leading-7 text-[#5d493d]">
              We could not load the Stripe receipt details from this environment,
              but the success redirect completed. If you configure Stripe keys and
              webhook forwarding, completed sessions will also be recorded in
              MongoDB.
            </p>
          </div>
        )}

        {orderSyncResult?.billingAddress || orderSyncResult?.shippingAddress ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {orderSyncResult.billingAddress ? (
              <div className="rounded-[1.5rem] border border-black/10 bg-white/50 p-5">
                <p className="section-kicker">Billing address</p>
                <div className="mt-4 space-y-1 text-sm leading-7 text-[#5d493d]">
                  {formatAddressLines(orderSyncResult.billingAddress).map((line, index) => (
                    <p key={`success-billing-${index}`}>{line}</p>
                  ))}
                </div>
              </div>
            ) : null}

            {orderSyncResult.shippingAddress ? (
              <div className="rounded-[1.5rem] border border-black/10 bg-white/50 p-5">
                <p className="section-kicker">Shipping address</p>
                <div className="mt-4 space-y-1 text-sm leading-7 text-[#5d493d]">
                  {formatAddressLines(orderSyncResult.shippingAddress).map((line, index) => (
                    <p key={`success-shipping-${index}`}>{line}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/books" className="btn-primary">
            Continue browsing
          </Link>
          <Link href="/cart" className="btn-secondary">
            Return to cart
          </Link>
        </div>
      </section>
    </main>
  );
}
