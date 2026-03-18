export type CartBook = {
  slug: string;
  title: string;
  author: string;
  price: number;
  palette: [string, string];
  imageUrl?: string;
  format: string;
  badge?: string;
  inventory: number;
};

export type CartItem = CartBook & {
  quantity: number;
};

export type CheckoutCartItem = Pick<CartItem, "slug" | "quantity">;
