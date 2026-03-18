import { NextResponse } from "next/server";
import Stripe from "stripe";

import { upsertOrderFromCheckoutSession } from "@/lib/orders";
import {
  getStripeSecretKeyConfigError,
  getStripeServer,
  isStripeConfigured,
  isStripeWebhookConfigured,
} from "@/lib/stripe";

export const runtime = "nodejs";

const FULFILLMENT_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

export async function POST(request: Request) {
  if (!isStripeConfigured || !isStripeWebhookConfigured) {
    return NextResponse.json(
      {
        message:
          getStripeSecretKeyConfigError() ||
          "Stripe keys are not fully configured.",
      },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { message: "Missing Stripe signature header." },
      { status: 400 },
    );
  }

  const payload = await request.text();
  const stripe = getStripeServer();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to verify Stripe webhook signature.",
      },
      { status: 400 },
    );
  }

  if (FULFILLMENT_EVENTS.has(event.type)) {
    await upsertOrderFromCheckoutSession(
      event.data.object as Stripe.Checkout.Session,
    );
  }

  return NextResponse.json({ received: true });
}
