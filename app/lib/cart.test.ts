import { describe, expect, it } from "vitest";
import {
  addItem,
  computeTotals,
  countItems,
  MAX_LINES,
  MAX_QUANTITY,
  normalizeCart,
  removeItem,
  setQuantity,
  type Cart,
} from "./cart";

describe("addItem", () => {
  it("adds a new product with quantity 1", () => {
    expect(addItem([], 5)).toEqual({
      status: "added",
      cart: [{ id: 5, quantity: 1 }],
    });
  });

  it("increments a product already in the cart", () => {
    const { cart } = addItem([{ id: 5, quantity: 2 }], 5);
    expect(cart).toEqual([{ id: 5, quantity: 3 }]);
  });

  it(`refuses to go above ${MAX_QUANTITY} of one product`, () => {
    const full: Cart = [{ id: 5, quantity: MAX_QUANTITY }];
    expect(addItem(full, 5)).toEqual({ status: "limit", cart: full });
  });

  it(`refuses a new product once the cart has ${MAX_LINES} lines`, () => {
    const cart: Cart = Array.from({ length: MAX_LINES }, (_, i) => ({
      id: i + 1,
      quantity: 1,
    }));
    expect(addItem(cart, 999).status).toBe("limit");
  });

  it("does not mutate the original cart", () => {
    const cart: Cart = [{ id: 5, quantity: 1 }];
    addItem(cart, 5);
    expect(cart).toEqual([{ id: 5, quantity: 1 }]);
  });
});

describe("setQuantity / removeItem", () => {
  const cart: Cart = [
    { id: 5, quantity: 2 },
    { id: 7, quantity: 1 },
  ];

  it("sets an exact quantity", () => {
    expect(setQuantity(cart, 5, 4)).toEqual([
      { id: 5, quantity: 4 },
      { id: 7, quantity: 1 },
    ]);
  });

  it(`clamps quantities above ${MAX_QUANTITY}`, () => {
    expect(setQuantity(cart, 5, 99)[0].quantity).toBe(MAX_QUANTITY);
  });

  it("removes the item when the quantity is 0", () => {
    expect(setQuantity(cart, 5, 0)).toEqual([{ id: 7, quantity: 1 }]);
  });

  it("ignores products that aren't in the cart", () => {
    expect(setQuantity(cart, 42, 3)).toEqual(cart);
  });

  it("removes an item", () => {
    expect(removeItem(cart, 7)).toEqual([{ id: 5, quantity: 2 }]);
  });
});

describe("normalizeCart", () => {
  it("keeps only valid, unique items and caps quantities", () => {
    const stored = [
      { id: 1, quantity: 3 },
      { id: 1, quantity: 2 }, // duplicate id
      { id: "x", quantity: 1 }, // wrong type
      { id: 2, quantity: 500 }, // over the limit
      null,
      { id: -4, quantity: 1 }, // invalid id
      { id: 3, quantity: 1.5 }, // not an integer
    ];
    expect(normalizeCart(stored)).toEqual([
      { id: 1, quantity: 3 },
      { id: 2, quantity: MAX_QUANTITY },
    ]);
  });

  it("returns an empty cart for anything that isn't an array", () => {
    expect(normalizeCart(undefined)).toEqual([]);
    expect(normalizeCart("nope")).toEqual([]);
    expect(normalizeCart({ id: 1, quantity: 1 })).toEqual([]);
  });
});

describe("countItems", () => {
  it("sums quantities across lines", () => {
    expect(
      countItems([
        { id: 1, quantity: 2 },
        { id: 2, quantity: 3 },
      ]),
    ).toBe(5);
  });
});

describe("computeTotals", () => {
  it("adds flat shipping to a non-empty order", () => {
    expect(computeTotals([{ price: 10, quantity: 2 }])).toEqual({
      subtotal: 20,
      shipping: 20,
      total: 40,
    });
  });

  it("charges nothing for an empty cart", () => {
    expect(computeTotals([])).toEqual({ subtotal: 0, shipping: 0, total: 0 });
  });

  it("sums in cents, avoiding floating-point drift", () => {
    // Naively: 0.1 * 3 === 0.30000000000000004
    expect(computeTotals([{ price: 0.1, quantity: 3 }]).subtotal).toBe(0.3);
    // The mockup's cart contents, added up correctly.
    const mockupCart = [
      { price: 199.99, quantity: 1 },
      { price: 89.99, quantity: 2 },
      { price: 59.99, quantity: 1 },
      { price: 19.99, quantity: 3 },
      { price: 49.99, quantity: 1 },
    ];
    expect(computeTotals(mockupCart)).toEqual({
      subtotal: 549.92,
      shipping: 20,
      total: 569.92,
    });
  });
});