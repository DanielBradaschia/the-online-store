/**
 * Pure cart logic - no cookies, no requests - so it's easy to test and
 * safe to import anywhere. The server-side session lives in cart.server.ts.
 */

export type CartItem = { id: number; quantity: number };
export type Cart = CartItem[];

export const MAX_QUANTITY = 10; // per product
export const MAX_LINES = 50; // distinct products; keeps the cookie well under 4 KB

export type AddResult =
  | { status: "added"; cart: Cart }
  | { status: "limit"; cart: Cart }; // already at MAX_QUANTITY (or cart full)

const isPositiveInt = (n: unknown): n is number =>
  typeof n === "number" && Number.isInteger(n) && n > 0;

/**
 * Turns whatever was stored into a valid Cart. The cookie is signed, so it
 * can't be forged - but its shape could be stale after a code change.
 */
export function normalizeCart(value: unknown): Cart {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  const cart: Cart = [];
  for (const item of value) {
    if (!item || !isPositiveInt(item.id) || !isPositiveInt(item.quantity)) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    cart.push({ id: item.id, quantity: Math.min(item.quantity, MAX_QUANTITY) });
    if (cart.length === MAX_LINES) break;
  }
  return cart;
}

export function addItem(cart: Cart, id: number): AddResult {
  const existing = cart.find((item) => item.id === id);

  if (existing) {
    if (existing.quantity >= MAX_QUANTITY) return { status: "limit", cart };
    return {
      status: "added",
      cart: cart.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    };
  }

  if (cart.length >= MAX_LINES) return { status: "limit", cart };
  return { status: "added", cart: [...cart, { id, quantity: 1 }] };
}

/** Quantity is clamped to 1..MAX_QUANTITY; 0 or less removes the item. */
export function setQuantity(cart: Cart, id: number, quantity: number): Cart {
  if (quantity <= 0) return removeItem(cart, id);
  const clamped = Math.min(Math.floor(quantity), MAX_QUANTITY);
  return cart.map((item) => (item.id === id ? { ...item, quantity: clamped } : item));
}

export function removeItem(cart: Cart, id: number): Cart {
  return cart.filter((item) => item.id !== id);
}

/** Total number of units - what the header badge shows. */
export function countItems(cart: Cart): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export const FLAT_SHIPPING = 20;

export type Totals = { subtotal: number; shipping: number; total: number };

/**
 * Money is summed in integer cents to avoid floating-point drift
 * (0.1 + 0.2 !== 0.3). Shipping is a flat fee on any non-empty order.
 */
export function computeTotals(
  lines: { price: number; quantity: number }[],
): Totals {
  const toCents = (n: number) => Math.round(n * 100);
  const subtotalCents = lines.reduce(
    (sum, line) => sum + toCents(line.price) * line.quantity,
    0,
  );
  const shippingCents = lines.length > 0 ? toCents(FLAT_SHIPPING) : 0;

  return {
    subtotal: subtotalCents / 100,
    shipping: shippingCents / 100,
    total: (subtotalCents + shippingCents) / 100,
  };
}