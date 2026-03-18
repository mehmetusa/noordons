import type { Metadata } from "next";
import Link from "next/link";

import { AccountAddressesForm } from "@/components/account-addresses-form";
import { BookCard } from "@/components/book-card";
import { OrderList } from "@/components/order-list";
import { SectionHeading } from "@/components/section-heading";
import { requireCurrentUser } from "@/lib/auth";
import { getBooks } from "@/lib/books";
import {
  formatCompactNumber,
  formatCurrencyFromCents,
  formatDate,
} from "@/lib/format";
import { getUserDashboardData } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Reader Dashboard | Noordons Books",
  description: "Track your Noordons Books account and order history.",
};

export const dynamic = "force-dynamic";

export default async function UserDashboardPage() {
  const currentUser = await requireCurrentUser("/dashboard");
  const [featuredBooks, dashboard] = await Promise.all([
    getBooks({ featured: true, limit: 3 }),
    getUserDashboardData({
      userId: currentUser.userId,
      email: currentUser.email,
    }),
  ]);

  return (
    <main className="page-frame space-y-8">
      <section className="section-panel px-6 py-8 sm:px-8">
        <SectionHeading
          eyebrow="Reader dashboard"
          title={`Welcome back, ${currentUser.name}.`}
          description="Your account is now session-based. Orders are loaded automatically from the email attached to your signed-in profile."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="stat-card">
            <p className="section-kicker">Account</p>
            <p className="mt-4 font-serif text-4xl leading-none text-[#1b140f]">
              {currentUser.role}
            </p>
            <p className="mt-4 text-sm leading-7 text-[#5d493d]">
              Signed in as {currentUser.email}.
            </p>
          </div>
          <div className="stat-card">
            <p className="section-kicker">Order count</p>
            <p className="mt-4 font-serif text-5xl leading-none text-[#1b140f]">
              {formatCompactNumber(dashboard.orderCount)}
            </p>
            <p className="mt-4 text-sm leading-7 text-[#5d493d]">
              Stored Stripe sessions currently matched to your account email.
            </p>
          </div>
          <div className="stat-card">
            <p className="section-kicker">Last order</p>
            <p className="mt-4 font-serif text-4xl leading-none text-[#1b140f]">
              {formatDate(dashboard.latestOrderAt)}
            </p>
            <p className="mt-4 text-sm leading-7 text-[#5d493d]">
              {dashboard.uniqueTitles} unique titles in your recorded history.
            </p>
          </div>
        </div>

        {dashboard.status === "unconfigured" ? (
          <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-white/50 p-5">
            <p className="text-sm leading-7 text-[#5d493d]">
              MongoDB order persistence is not configured yet, so this dashboard
              cannot show completed orders until webhook-backed `Order` documents
              are being stored.
            </p>
          </div>
        ) : null}

        {dashboard.status === "error" ? (
          <div className="mt-6 rounded-[1.5rem] border border-[#b36c61]/30 bg-[#fff1ee] p-5">
            <p className="text-sm leading-7 text-[#7f463f]">
              The order store is currently unreachable. Check the MongoDB
              connection and Stripe webhook delivery before relying on this
              dashboard.
            </p>
          </div>
        ) : null}
      </section>

      <AccountAddressesForm
        billingAddress={currentUser.billingAddress}
        shippingAddress={currentUser.shippingAddress}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card">
          <p className="section-kicker">Orders</p>
          <p className="mt-4 font-serif text-5xl leading-none text-[#1b140f]">
            {formatCompactNumber(dashboard.orderCount)}
          </p>
          <p className="mt-4 text-sm leading-7 text-[#5d493d]">
            Completed or recorded sessions matched to your account.
          </p>
        </div>
        <div className="stat-card">
          <p className="section-kicker">Spend</p>
          <p className="mt-4 font-serif text-5xl leading-none text-[#1b140f]">
            {formatCurrencyFromCents(dashboard.totalSpent)}
          </p>
          <p className="mt-4 text-sm leading-7 text-[#5d493d]">
            Total tracked revenue from Stripe sessions attached to your email.
          </p>
        </div>
        <div className="stat-card">
          <p className="section-kicker">Books</p>
          <p className="mt-4 font-serif text-5xl leading-none text-[#1b140f]">
            {formatCompactNumber(dashboard.totalBooks)}
          </p>
          <p className="mt-4 text-sm leading-7 text-[#5d493d]">
            Total copies purchased across all saved orders.
          </p>
        </div>
        <div className="stat-card">
          <p className="section-kicker">Recommended flow</p>
          <p className="mt-4 font-serif text-4xl leading-none text-[#1b140f]">
            Stripe
          </p>
          <p className="mt-4 text-sm leading-7 text-[#5d493d]">
            Stay logged in before checkout so future orders are easier to
            reconcile with your account.
          </p>
        </div>
      </section>

      <OrderList
        orders={dashboard.orders}
        emptyTitle="No recorded orders for this account yet."
        emptyCopy="If you have completed a Stripe payment, make sure webhook delivery is working and that MongoDB is persisting the checkout session into the Order collection."
      />

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="section-kicker">Recommended next</p>
            <h2 className="mt-3 font-serif text-4xl leading-none text-[#1b140f]">
              Keep the shelf moving.
            </h2>
          </div>
          <Link href="/books" className="btn-secondary">
            Browse all books
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredBooks.map((book) => (
            <BookCard key={book.slug} book={book} />
          ))}
        </div>
      </section>
    </main>
  );
}
