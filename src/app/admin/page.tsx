import type { Metadata } from "next";
import Link from "next/link";

import { AdminBookForm } from "@/components/admin-book-form";
import { InventoryTable } from "@/components/inventory-table";
import { OrderList } from "@/components/order-list";
import { SectionHeading } from "@/components/section-heading";
import { requireAdminUser } from "@/lib/auth";
import { getInventoryBooks } from "@/lib/books";
import { formatCompactNumber, formatCurrencyFromCents } from "@/lib/format";
import { getAdminDashboardData } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Admin Dashboard | Noordons Books",
  description: "Store analytics, product creation, and inventory management.",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const currentUser = await requireAdminUser("/admin");
  const [dashboard, inventoryBooks] = await Promise.all([
    getAdminDashboardData(),
    getInventoryBooks(),
  ]);
  const inStockTitles = inventoryBooks.filter((book) => book.inventory > 0).length;
  const outOfStockTitles = inventoryBooks.filter(
    (book) => book.inventory <= 0,
  ).length;
  const totalUnits = inventoryBooks.reduce(
    (total, book) => total + book.inventory,
    0,
  );
  const lowStockTitles = inventoryBooks.filter(
    (book) => book.inventory > 0 && book.inventory <= 10,
  ).length;

  return (
    <main className="page-frame space-y-8">
      <section className="section-panel px-6 py-8 sm:px-8">
        <SectionHeading
          eyebrow="Admin dashboard"
          title={`Store controls for ${currentUser.name}.`}
          description="Add books with cover images, review live stock levels, and monitor sales from a role-protected admin surface."
          actionHref="/dashboard"
          actionLabel="Open reader view"
        />

        {dashboard.status === "unconfigured" ? (
          <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-white/50 p-5">
            <p className="text-sm leading-7 text-[#5d493d]">
              MongoDB order storage is not configured, so revenue and order
              analytics will remain empty until Stripe webhooks are writing to
              the `Order` collection.
            </p>
          </div>
        ) : null}

        {dashboard.status === "error" ? (
          <div className="mt-6 rounded-[1.5rem] border border-[#b36c61]/30 bg-[#fff1ee] p-5">
            <p className="text-sm leading-7 text-[#7f463f]">
              The admin analytics store could not be reached. Check the MongoDB
              connection string and webhook persistence flow.
            </p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card">
          <p className="section-kicker">Gross revenue</p>
          <p className="mt-4 font-serif text-5xl leading-none text-[#1b140f]">
            {formatCurrencyFromCents(dashboard.grossRevenue)}
          </p>
          <p className="mt-4 text-sm leading-7 text-[#5d493d]">
            Based on paid Stripe sessions currently persisted to MongoDB.
          </p>
        </div>
        <div className="stat-card">
          <p className="section-kicker">Orders</p>
          <p className="mt-4 font-serif text-5xl leading-none text-[#1b140f]">
            {formatCompactNumber(dashboard.orderCount)}
          </p>
          <p className="mt-4 text-sm leading-7 text-[#5d493d]">
            {dashboard.paidOrders} paid sessions recorded so far.
          </p>
        </div>
        <div className="stat-card">
          <p className="section-kicker">Average order</p>
          <p className="mt-4 font-serif text-5xl leading-none text-[#1b140f]">
            {formatCurrencyFromCents(dashboard.avgOrderValue)}
          </p>
          <p className="mt-4 text-sm leading-7 text-[#5d493d]">
            Average paid order value across stored sessions.
          </p>
        </div>
        <div className="stat-card">
          <p className="section-kicker">Customers</p>
          <p className="mt-4 font-serif text-5xl leading-none text-[#1b140f]">
            {formatCompactNumber(dashboard.uniqueCustomers)}
          </p>
          <p className="mt-4 text-sm leading-7 text-[#5d493d]">
            Distinct paying email addresses recorded in the order store.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card">
          <p className="section-kicker">Catalog titles</p>
          <p className="mt-4 font-serif text-5xl leading-none text-[#1b140f]">
            {formatCompactNumber(inventoryBooks.length)}
          </p>
          <p className="mt-4 text-sm leading-7 text-[#5d493d]">
            Books currently stored in the live catalog collection.
          </p>
        </div>
        <div className="stat-card">
          <p className="section-kicker">In-stock titles</p>
          <p className="mt-4 font-serif text-5xl leading-none text-[#1b140f]">
            {formatCompactNumber(inStockTitles)}
          </p>
          <p className="mt-4 text-sm leading-7 text-[#5d493d]">
            Titles readers can purchase right now.
          </p>
        </div>
        <div className="stat-card">
          <p className="section-kicker">Units on hand</p>
          <p className="mt-4 font-serif text-5xl leading-none text-[#1b140f]">
            {formatCompactNumber(totalUnits)}
          </p>
          <p className="mt-4 text-sm leading-7 text-[#5d493d]">
            Combined stock count across the full product catalog.
          </p>
        </div>
        <div className="stat-card">
          <p className="section-kicker">Stock alerts</p>
          <p className="mt-4 font-serif text-5xl leading-none text-[#1b140f]">
            {formatCompactNumber(lowStockTitles + outOfStockTitles)}
          </p>
          <p className="mt-4 text-sm leading-7 text-[#5d493d]">
            {lowStockTitles} low-stock, {outOfStockTitles} out-of-stock titles.
          </p>
        </div>
      </section>

      <AdminBookForm />

      <InventoryTable books={inventoryBooks} />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="section-panel px-6 py-6 sm:px-7">
          <p className="section-kicker">Top titles</p>
          <h2 className="mt-3 font-serif text-4xl leading-none text-[#1b140f]">
            Best-performing books.
          </h2>

          <div className="mt-6 space-y-4">
            {dashboard.topTitles.length ? (
              dashboard.topTitles.map((title) => (
                <div
                  key={title.title}
                  className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-black/10 bg-white/50 p-4"
                >
                  <div>
                    <h3 className="font-serif text-2xl leading-none text-[#1b140f]">
                      {title.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[#5d493d]">
                      {title.quantity} copies sold
                    </p>
                  </div>
                  <span className="price-chip">
                    {formatCurrencyFromCents(title.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm leading-7 text-[#5d493d]">
                Top-title analytics will appear once paid orders are available.
              </p>
            )}
          </div>
        </div>

        <div className="section-panel px-6 py-6 sm:px-7">
          <p className="section-kicker">Inventory watch</p>
          <h2 className="mt-3 font-serif text-4xl leading-none text-[#1b140f]">
            Low-stock titles.
          </h2>

          <div className="mt-6 space-y-4">
            {dashboard.lowStockBooks.length ? (
              dashboard.lowStockBooks.map((book) => (
                <div
                  key={book.slug}
                  className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-black/10 bg-white/50 p-4"
                >
                  <div>
                    <h3 className="font-serif text-2xl leading-none text-[#1b140f]">
                      {book.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[#5d493d]">
                      {book.format} / {book.genre}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="price-chip">{book.inventory} left</p>
                    <p className="mt-2 text-sm text-[#5d493d]">
                      <Link href={`/books/${book.slug}`} className="nav-link">
                        Open title
                      </Link>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm leading-7 text-[#5d493d]">
                Low-stock alerts will appear here after you add products with
                inventory counts.
              </p>
            )}
          </div>
        </div>
      </section>

      <OrderList
        orders={dashboard.orders}
        showCustomer
        emptyTitle="No recent orders recorded yet."
        emptyCopy="Once Stripe webhooks are writing checkout sessions into MongoDB, the latest orders will appear here."
      />
    </main>
  );
}
