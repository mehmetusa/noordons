"use client";

import { useEffect, useEffectEvent } from "react";

import { useCart } from "@/components/cart-provider";

type ClearCartOnSuccessProps = {
  enabled: boolean;
};

export function ClearCartOnSuccess({ enabled }: ClearCartOnSuccessProps) {
  const { clearCart } = useCart();
  const clearCartOnSuccess = useEffectEvent(() => {
    clearCart();
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    clearCartOnSuccess();
  }, [enabled]);

  return null;
}
