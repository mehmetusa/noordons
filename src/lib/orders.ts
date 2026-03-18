import type Stripe from "stripe";

import {
  addressFromStripe,
  normalizeAddress,
  readAddressFromMetadata,
} from "@/lib/address";
import { getInventoryBooks } from "@/lib/books";
import { dbConnect, isMongoConfigured } from "@/lib/mongodb";
import { OrderModel, type OrderDocument } from "@/models/Order";
import type { Address } from "@/types/address";
import type { Book } from "@/types/book";

import { getStripeServer } from "./stripe";

export type OrderStoreStatus = "ready" | "unconfigured" | "error";

export type DashboardOrderLineItem = {
  title: string;
  quantity: number;
  unitAmount: number;
  amountTotal: number;
};

export type DashboardOrder = {
  checkoutSessionId: string;
  userId: string | null;
  paymentStatus: string;
  status: string | null;
  customerEmail: string | null;
  customerName: string | null;
  currency: string | null;
  amountSubtotal: number | null;
  amountTotal: number | null;
  stripeInvoiceId: string | null;
  billingAddress: Address | null;
  shippingAddress: Address | null;
  lineItems: DashboardOrderLineItem[];
  completedAt: Date | null;
  createdAt: Date | null;
};

export type UserDashboardData = {
  status: OrderStoreStatus;
  email: string;
  orders: DashboardOrder[];
  orderCount: number;
  totalSpent: number;
  totalBooks: number;
  uniqueTitles: number;
  latestOrderAt: Date | null;
};

export type AdminDashboardData = {
  status: OrderStoreStatus;
  orders: DashboardOrder[];
  orderCount: number;
  paidOrders: number;
  grossRevenue: number;
  avgOrderValue: number;
  uniqueCustomers: number;
  topTitles: Array<{
    title: string;
    quantity: number;
    revenue: number;
  }>;
  lowStockBooks: Book[];
};

type RawOrder = Partial<OrderDocument> & {
  _id?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};

function normalizeReference(reference: string | { id?: string } | null) {
  return typeof reference === "string" ? reference : null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeOrder(document: RawOrder): DashboardOrder {
  return {
    checkoutSessionId: document.checkoutSessionId ?? "unknown-session",
    userId: document.userId ?? null,
    paymentStatus: document.paymentStatus ?? "unknown",
    status: document.status ?? null,
    customerEmail: document.customerEmail ?? null,
    customerName: document.customerName ?? null,
    currency: document.currency ?? null,
    amountSubtotal: document.amountSubtotal ?? null,
    amountTotal: document.amountTotal ?? null,
    stripeInvoiceId: document.stripeInvoiceId ?? null,
    billingAddress: normalizeAddress(document.billingAddress as Address | null),
    shippingAddress: normalizeAddress(document.shippingAddress as Address | null),
    lineItems: Array.isArray(document.lineItems)
      ? document.lineItems.map((item) => ({
          title: item.title ?? "Untitled line item",
          quantity: item.quantity ?? 1,
          unitAmount: item.unitAmount ?? 0,
          amountTotal: item.amountTotal ?? 0,
        }))
      : [],
    completedAt: document.completedAt ?? null,
    createdAt: document.createdAt ?? null,
  };
}

async function readOrders(
  filter: Record<string, unknown> = {},
  limit = 50,
): Promise<{
  status: OrderStoreStatus;
  orders: DashboardOrder[];
}> {
  if (!isMongoConfigured) {
    return {
      status: "unconfigured",
      orders: [],
    };
  }

  try {
    await dbConnect();

    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return {
      status: "ready",
      orders: orders.map((order) => normalizeOrder(order as RawOrder)),
    };
  } catch (error) {
    console.error("Failed to read orders from MongoDB.", error);

    return {
      status: "error",
      orders: [],
    };
  }
}

export async function getOrdersByCustomer(
  input: {
    userId?: string | null;
    email?: string | null;
  },
): Promise<{
  status: OrderStoreStatus;
  orders: DashboardOrder[];
}> {
  const trimmedEmail = input.email?.trim() ?? "";
  const trimmedUserId = input.userId?.trim() ?? "";

  if (!trimmedEmail && !trimmedUserId) {
    return {
      status: isMongoConfigured ? "ready" : "unconfigured",
      orders: [] as DashboardOrder[],
    };
  }

  if (trimmedUserId) {
    const userIdOrders = await readOrders({ userId: trimmedUserId }, 25);

    if (userIdOrders.orders.length > 0 || !trimmedEmail) {
      return userIdOrders;
    }
  }

  return readOrders(
    {
      customerEmail: new RegExp(`^${escapeRegExp(trimmedEmail)}$`, "i"),
    },
    25,
  );
}

export async function getRecentOrders(limit = 12) {
  return readOrders({}, limit);
}

export async function getUserDashboardData(input: {
  userId?: string | null;
  email: string;
}): Promise<UserDashboardData> {
  const { status, orders } = await getOrdersByCustomer(input);

  return {
    status,
    email: input.email,
    orders,
    orderCount: orders.length,
    totalSpent: orders.reduce(
      (total, order) => total + (order.amountTotal ?? 0),
      0,
    ),
    totalBooks: orders.reduce(
      (total, order) =>
        total +
        order.lineItems.reduce((itemTotal, item) => itemTotal + item.quantity, 0),
      0,
    ),
    uniqueTitles: new Set(
      orders.flatMap((order) => order.lineItems.map((item) => item.title)),
    ).size,
    latestOrderAt: orders[0]?.completedAt ?? orders[0]?.createdAt ?? null,
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [{ status, orders }, allBooks] = await Promise.all([
    readOrders({}, 250),
    getInventoryBooks(),
  ]);

  const paidOrders = orders.filter((order) => order.paymentStatus === "paid");
  const grossRevenue = paidOrders.reduce(
    (total, order) => total + (order.amountTotal ?? 0),
    0,
  );
  const uniqueCustomers = new Set(
    paidOrders
      .map((order) => order.customerEmail?.toLowerCase())
      .filter((value): value is string => Boolean(value)),
  ).size;
  const titleMap = new Map<string, { quantity: number; revenue: number }>();

  for (const order of paidOrders) {
    for (const lineItem of order.lineItems) {
      const current = titleMap.get(lineItem.title) ?? {
        quantity: 0,
        revenue: 0,
      };

      current.quantity += lineItem.quantity;
      current.revenue += lineItem.amountTotal;
      titleMap.set(lineItem.title, current);
    }
  }

  const topTitles = Array.from(titleMap.entries())
    .map(([title, value]) => ({
      title,
      quantity: value.quantity,
      revenue: value.revenue,
    }))
    .sort((left, right) => {
      return right.quantity - left.quantity || right.revenue - left.revenue;
    })
    .slice(0, 5);

  return {
    status,
    orders: orders.slice(0, 12),
    orderCount: orders.length,
    paidOrders: paidOrders.length,
    grossRevenue,
    avgOrderValue: paidOrders.length
      ? Math.round(grossRevenue / paidOrders.length)
      : 0,
    uniqueCustomers,
    topTitles,
    lowStockBooks: allBooks
      .filter((book) => book.inventory <= 20)
      .sort((left, right) => left.inventory - right.inventory)
      .slice(0, 6),
  };
}

export async function upsertOrderFromCheckoutSession(
  session: Stripe.Checkout.Session,
) {
  if (!isMongoConfigured) {
    return null;
  }

  await dbConnect();

  const stripe = getStripeServer();
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
  });

  const normalizedLineItems = lineItems.data.map((item) => ({
    title: item.description ?? "Untitled line item",
    quantity: item.quantity ?? 1,
    unitAmount: item.price?.unit_amount ?? 0,
    amountTotal: item.amount_total,
  }));

  const billingAddress =
    addressFromStripe(session.customer_details?.address, {
      fullName: session.customer_details?.name,
      phone: session.customer_details?.phone,
    }) ?? readAddressFromMetadata("billing", session.metadata);
  const shippingAddress = readAddressFromMetadata("shipping", session.metadata);

  const order = await OrderModel.findOneAndUpdate(
    { checkoutSessionId: session.id },
    {
      checkoutSessionId: session.id,
      userId: session.metadata?.userId || session.client_reference_id || undefined,
      paymentStatus: session.payment_status,
      status: session.status ?? undefined,
      customerEmail:
        session.customer_details?.email ?? session.customer_email ?? undefined,
      customerName: session.customer_details?.name ?? undefined,
      currency: session.currency ?? undefined,
      amountSubtotal: session.amount_subtotal ?? undefined,
      amountTotal: session.amount_total ?? undefined,
      stripeCustomerId: normalizeReference(session.customer),
      stripePaymentIntentId: normalizeReference(session.payment_intent),
      stripeInvoiceId: normalizeReference(session.invoice),
      billingAddress: billingAddress ?? undefined,
      shippingAddress: shippingAddress ?? undefined,
      lineItems: normalizedLineItems,
      completedAt: session.created ? new Date(session.created * 1000) : undefined,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  ).lean();

  return order ? normalizeOrder(order as RawOrder) : null;
}

export async function syncOrderFromCheckoutSessionId(sessionId: string) {
  if (!isMongoConfigured || !sessionId.trim()) {
    return null;
  }

  const stripe = getStripeServer();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return upsertOrderFromCheckoutSession(session);
}
