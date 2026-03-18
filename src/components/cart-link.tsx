"use client";

import Link from "next/link";

import { useCart } from "@/components/cart-provider";

export function CartLink() {
  const { hasHydrated, itemCount } = useCart();
  const labelCount = hasHydrated ? itemCount : 0;

  return (
    <Link href="/cart" className="cart-link">
      <span>Cart</span>
      <span className="cart-link__count">{labelCount}</span>
    </Link>
  );
}
