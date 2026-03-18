import { formatAddressLines } from "@/lib/address";
import type { DashboardOrder } from "@/lib/orders";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";

type OrderListProps = {
  orders: DashboardOrder[];
  emptyTitle: string;
  emptyCopy: string;
  showCustomer?: boolean;
};

export function OrderList({
  orders,
  emptyTitle,
  emptyCopy,
  showCustomer = false,
}: OrderListProps) {
  if (!orders.length) {
    return (
      <section className="section-panel px-6 py-10 sm:px-8">
        <p className="section-kicker">Orders</p>
        <h2 className="mt-4 font-serif text-4xl leading-none text-[#1b140f] sm:text-5xl">
          {emptyTitle}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5d493d]">
          {emptyCopy}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {orders.map((order) => (
        <article key={order.checkoutSessionId} className="section-panel px-6 py-6 sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Order</p>
              <h2 className="mt-2 font-serif text-3xl leading-none text-[#1b140f]">
                {order.checkoutSessionId}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#5d493d]">
                Placed {formatDate(order.completedAt ?? order.createdAt)}
              </p>
              {showCustomer ? (
                <p className="text-sm leading-7 text-[#5d493d]">
                  {order.customerName || order.customerEmail || "Unknown customer"}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7e6455]">
              <span className="pill">{order.paymentStatus}</span>
              {order.status ? <span className="pill">{order.status}</span> : null}
              <span className="price-chip">
                {formatCurrencyFromCents(order.amountTotal ?? 0)}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {order.lineItems.map((item) => (
              <div
                key={`${order.checkoutSessionId}-${item.title}`}
                className="rounded-[1.25rem] border border-black/10 bg-white/50 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-serif text-2xl leading-none text-[#1b140f]">
                    {item.title}
                  </h3>
                  <span className="pill">{item.quantity} qty</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-[#5d493d]">
                  Line total: {formatCurrencyFromCents(item.amountTotal)}
                </p>
              </div>
            ))}
          </div>

          {order.billingAddress || order.shippingAddress ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {order.billingAddress ? (
                <div className="rounded-[1.25rem] border border-black/10 bg-white/50 p-4">
                  <p className="section-kicker">Billing address</p>
                  <div className="mt-3 space-y-1 text-sm leading-7 text-[#5d493d]">
                    {formatAddressLines(order.billingAddress).map((line, index) => (
                      <p key={`${order.checkoutSessionId}-billing-${index}`}>{line}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              {order.shippingAddress ? (
                <div className="rounded-[1.25rem] border border-black/10 bg-white/50 p-4">
                  <p className="section-kicker">Shipping address</p>
                  <div className="mt-3 space-y-1 text-sm leading-7 text-[#5d493d]">
                    {formatAddressLines(order.shippingAddress).map((line, index) => (
                      <p key={`${order.checkoutSessionId}-shipping-${index}`}>{line}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}
