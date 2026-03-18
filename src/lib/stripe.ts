import Stripe from "stripe";

import { updateUserStripeCustomerId, type SessionUser } from "@/lib/auth";

let stripeServer: Stripe | null = null;

const VALID_STRIPE_SECRET_KEY_PREFIXES = [
  "sk_test_",
  "sk_live_",
  "rk_test_",
  "rk_live_",
] as const;

export function getStripeSecretKeyConfigError(secretKey = process.env.STRIPE_SECRET_KEY) {
  const normalizedKey = secretKey?.trim();

  if (!normalizedKey) {
    return "STRIPE_SECRET_KEY is not configured.";
  }

  if (
    !VALID_STRIPE_SECRET_KEY_PREFIXES.some((prefix) =>
      normalizedKey.startsWith(prefix),
    )
  ) {
    return "STRIPE_SECRET_KEY must start with sk_test_, sk_live_, rk_test_, or rk_live_.";
  }

  return null;
}

export const isStripeConfigured = !getStripeSecretKeyConfigError();
export const isStripeWebhookConfigured = Boolean(
  process.env.STRIPE_WEBHOOK_SECRET,
);

export type CheckoutSessionSummary = {
  id: string;
  customerEmail: string | null;
  invoiceId: string | null;
  amountTotal: number | null;
  currency: string | null;
  paymentStatus: string;
  status: string | null;
  items: Array<{
    title: string;
    quantity: number;
    unitAmount: number;
    amountTotal: number;
  }>;
};

export function getStripeServer() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const configError = getStripeSecretKeyConfigError(secretKey);

  if (configError) {
    throw new Error(configError);
  }

  const usableSecretKey = secretKey!;

  if (!stripeServer) {
    stripeServer = new Stripe(usableSecretKey);
  }

  return stripeServer;
}

function toStripeAddress(address: NonNullable<SessionUser["billingAddress"]>) {
  return {
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postal_code: address.postalCode,
    country: address.country,
  } satisfies Stripe.AddressParam;
}

function toStripeShipping(address: NonNullable<SessionUser["shippingAddress"]>) {
  return {
    name: address.fullName,
    phone: address.phone,
    address: toStripeAddress(address),
  } satisfies Stripe.CustomerCreateParams.Shipping;
}

export async function ensureStripeCustomerForUser(user: SessionUser) {
  if (!user.billingAddress || !user.shippingAddress) {
    throw new Error(
      "Save billing and shipping addresses in your dashboard before checkout.",
    );
  }

  const stripe = getStripeServer();
  const payload = {
    email: user.email,
    name: user.name,
    address: toStripeAddress(user.billingAddress),
    shipping: toStripeShipping(user.shippingAddress),
  };

  if (user.stripeCustomerId) {
    try {
      return await stripe.customers.update(user.stripeCustomerId, payload);
    } catch (error) {
      console.error("Failed to update existing Stripe customer.", error);
    }
  }

  const customer = await stripe.customers.create(payload);
  await updateUserStripeCustomerId(user.userId, customer.id);
  return customer;
}

export async function getCheckoutSessionSummary(sessionId: string) {
  if (!isStripeConfigured) {
    return null;
  }

  const stripe = getStripeServer();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 100,
  });

  return {
    id: session.id,
    customerEmail:
      session.customer_details?.email ?? session.customer_email ?? null,
    invoiceId:
      typeof session.invoice === "string"
        ? session.invoice
        : session.invoice?.id ?? null,
    amountTotal: session.amount_total ?? null,
    currency: session.currency ?? null,
    paymentStatus: session.payment_status,
    status: session.status ?? null,
    items: lineItems.data.map((item) => ({
      title: item.description ?? "Untitled line item",
      quantity: item.quantity ?? 1,
      unitAmount: item.price?.unit_amount ?? 0,
      amountTotal: item.amount_total,
    })),
  } satisfies CheckoutSessionSummary;
}
