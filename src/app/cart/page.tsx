import type { Metadata } from "next";

import { CartPageClient } from "@/components/cart-page-client";
import { SectionHeading } from "@/components/section-heading";
import { getStripeSecretKeyConfigError } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Your Cart | Noordons Books",
  description: "Review your cart and continue to Stripe Checkout.",
};

export default function CartPage() {
  const stripeConfigurationError = getStripeSecretKeyConfigError();
  const stripeReady = !stripeConfigurationError;

  return (
    <main className="page-frame space-y-8">
      <section className="section-panel px-6 py-8 sm:px-8">
        <SectionHeading
          eyebrow="Cart"
          title="Review your shelf before checkout."
          description="Adjust quantities, remove titles, and start a Stripe Checkout session from a validated server-side order summary."
        />
      </section>

      <CartPageClient
        stripeReady={stripeReady}
        stripeConfigurationError={stripeConfigurationError}
      />
    </main>
  );
}
