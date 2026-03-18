import { type NextRequest, NextResponse } from "next/server";

import { getCurrentUser, sanitizeRedirect } from "@/lib/auth";
import { serializeAddressToMetadata } from "@/lib/address";
import { getBookBySlug } from "@/lib/books";
import {
  ensureStripeCustomerForUser,
  getStripeSecretKeyConfigError,
  getStripeServer,
  isStripeConfigured,
} from "@/lib/stripe";
import type { CheckoutCartItem } from "@/types/cart";

export const runtime = "nodejs";

type CheckoutRequestBody = {
  items?: CheckoutCartItem[];
  loginRedirectTo?: string;
};

function jsonError(message: string, status = 500) {
  return NextResponse.json({ message }, { status });
}

function getBaseUrl(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (forwardedHost) {
    return `${forwardedProto ?? "http"}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}

function normalizeItems(items: CheckoutCartItem[]) {
  const grouped = new Map<string, number>();

  for (const item of items) {
    const slug = typeof item.slug === "string" ? item.slug.trim() : "";
    const quantity = Number(item.quantity);

    if (!slug || !Number.isInteger(quantity) || quantity < 1) {
      continue;
    }

    grouped.set(slug, (grouped.get(slug) ?? 0) + quantity);
  }

  return Array.from(grouped.entries()).map(([slug, quantity]) => ({
    slug,
    quantity,
  }));
}

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured) {
      return jsonError(
        getStripeSecretKeyConfigError() || "STRIPE_SECRET_KEY is not configured.",
      );
    }

    let body: CheckoutRequestBody;

    try {
      body = (await request.json()) as CheckoutRequestBody;
    } catch {
      return jsonError("Invalid JSON payload.", 400);
    }

    const normalizedItems = normalizeItems(body.items ?? []);

    if (!normalizedItems.length) {
      return jsonError("Your cart is empty.", 400);
    }

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      const nextPath = sanitizeRedirect(body.loginRedirectTo, "/cart");

      return NextResponse.json(
        {
          message: "Sign in to continue to checkout.",
          redirectTo: `/login?next=${encodeURIComponent(nextPath)}`,
        },
        { status: 401 },
      );
    }

    if (!currentUser.billingAddress || !currentUser.shippingAddress) {
      return jsonError(
        "Add both billing and shipping addresses in your dashboard before checkout.",
        400,
      );
    }

    const cartBooks = await Promise.all(
      normalizedItems.map(async ({ slug, quantity }) => {
        const book = await getBookBySlug(slug);

        if (!book) {
          throw new Error(`Book not found for slug "${slug}".`);
        }

        if (quantity > book.inventory) {
          throw new Error(
            `Only ${book.inventory} cop${book.inventory === 1 ? "y" : "ies"} of ${book.title} currently available.`,
          );
        }

        return { book, quantity };
      }),
    ).catch((error: unknown) => {
      return error instanceof Error
        ? error
        : new Error("Unable to validate cart.");
    });

    if (cartBooks instanceof Error) {
      return jsonError(cartBooks.message, 400);
    }

    const stripe = getStripeServer();
    const baseUrl = getBaseUrl(request);
    const stripeCustomer = await ensureStripeCustomerForUser(currentUser);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      billing_address_collection: "required",
      customer: stripeCustomer.id,
      customer_update: {
        address: "auto",
        name: "auto",
        shipping: "auto",
      },
      invoice_creation: {
        enabled: true,
      },
      allow_promotion_codes: true,
      client_reference_id: currentUser.userId,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      line_items: cartBooks.map(({ book, quantity }) => ({
        quantity,
        adjustable_quantity: {
          enabled: true,
          minimum: 1,
          maximum: Math.max(1, Math.min(book.inventory, 20)),
        },
        price_data: {
          currency: "usd",
          unit_amount: Math.round(book.price * 100),
          product_data: {
            name: book.title,
            description: `by ${book.author} • ${book.format}`,
            metadata: {
              author: book.author,
              format: book.format,
              slug: book.slug,
            },
          },
        },
      })),
      metadata: {
        source: "noordons-books",
        userId: currentUser.userId,
        userEmail: currentUser.email,
        itemCount: String(
          cartBooks.reduce((total, item) => total + item.quantity, 0),
        ),
        ...serializeAddressToMetadata("billing", currentUser.billingAddress),
        ...serializeAddressToMetadata("shipping", currentUser.shippingAddress),
      },
    });

    if (!session.url) {
      return jsonError("Stripe did not return a checkout URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create Stripe Checkout session.", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Unable to start Stripe Checkout.",
    );
  }
}
