"use client";

import { useState } from "react";

import type { CheckoutCartItem } from "@/types/cart";

type CheckoutButtonProps = {
  items: CheckoutCartItem[];
  disabled?: boolean;
  loginRedirectTo?: string;
};

export function CheckoutButton({
  items,
  disabled = false,
  loginRedirectTo = "/cart",
}: CheckoutButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function readCheckoutResponse(response: Response) {
    const rawBody = await response.text();

    if (!rawBody.trim()) {
      return {} as { message?: string; url?: string };
    }

    try {
      return JSON.parse(rawBody) as { message?: string; url?: string };
    } catch {
      return {
        message: rawBody,
      } satisfies { message?: string; url?: string };
    }
  }

  async function handleCheckout() {
    if (!items.length || disabled) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          loginRedirectTo,
        }),
      });

      const payload = (await readCheckoutResponse(response)) as {
        message?: string;
        url?: string;
        redirectTo?: string;
      };

      if (response.status === 401 && payload.redirectTo) {
        window.location.assign(payload.redirectTo);
        return;
      }

      if (!response.ok || !payload.url) {
        throw new Error(payload.message || "Unable to start Stripe Checkout.");
      }

      window.location.assign(payload.url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to start Stripe Checkout.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="btn-primary w-full"
        onClick={handleCheckout}
        disabled={disabled || isSubmitting || !items.length}
      >
        {isSubmitting ? "Redirecting to Stripe..." : "Checkout with Stripe"}
      </button>

      {errorMessage ? (
        <p className="text-sm leading-7 text-[#8f443f]">{errorMessage}</p>
      ) : null}
    </div>
  );
}
