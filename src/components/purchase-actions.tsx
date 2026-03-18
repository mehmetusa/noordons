"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/cart-provider";
import type { Book } from "@/types/book";

type PurchaseActionsProps = {
  book: Pick<
    Book,
    | "slug"
    | "title"
    | "author"
    | "price"
    | "palette"
    | "imageUrl"
    | "format"
    | "badge"
    | "inventory"
  >;
};

export function PurchaseActions({ book }: PurchaseActionsProps) {
  const { addBook } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const isOutOfStock = book.inventory < 1;

  function handleAddToCart() {
    if (isOutOfStock) {
      setStatusMessage(`${book.title} is currently out of stock.`);
      return;
    }

    addBook(book, quantity);
    setStatusMessage(
      `${quantity} cop${quantity === 1 ? "y" : "ies"} of ${book.title} added to cart.`,
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#8b6d5a]">
          Quantity
        </span>
        <div className="quantity-picker">
          <button
            type="button"
            className="quantity-picker__button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1 || isOutOfStock}
          >
            -
          </button>
          <span className="quantity-picker__value">{quantity}</span>
          <button
            type="button"
            className="quantity-picker__button"
            onClick={() =>
              setQuantity((current) => Math.min(book.inventory, current + 1))
            }
            disabled={quantity >= book.inventory || isOutOfStock}
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
      >
        {isOutOfStock ? "Out of stock" : "Add to cart"}
      </button>
      <Link href="/cart" className="btn-secondary">
        View cart
      </Link>

      {statusMessage ? (
        <p className="text-sm leading-7 text-[#5d493d]">{statusMessage}</p>
      ) : null}
    </div>
  );
}
