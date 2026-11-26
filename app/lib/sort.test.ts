import { describe, expect, it } from "vitest";
import { DEFAULT_SORT, parseSort, sortProducts, toApiSort } from "./sort";

describe("parseSort", () => {
  it("defaults to featured when missing", () => {
    expect(parseSort(null)).toBe(DEFAULT_SORT);
  });

  it("accepts known values", () => {
    expect(parseSort("price-desc")).toBe("price-desc");
  });

  it("rejects unknown values (so the loader can redirect)", () => {
    expect(parseSort("price")).toBeNull();
    expect(parseSort("id-desc; DROP TABLE")).toBeNull();
  });
});

describe("toApiSort", () => {
  it("maps our URL values onto DummyJSON's sortBy/order", () => {
    expect(toApiSort("name-desc")).toEqual({ sortBy: "title", order: "desc" });
    expect(toApiSort("rating-desc")).toEqual({ sortBy: "rating", order: "desc" });
  });

  it("sends no sort params for featured", () => {
    expect(toApiSort("featured")).toEqual({ sortBy: undefined, order: undefined });
  });
});

describe("sortProducts", () => {
  const products = [
    { id: 3, price: 10, title: "banana", rating: 4.1 },
    { id: 1, price: 30, title: "Apple", rating: 4.9 },
    { id: 2, price: 10, title: "cherry", rating: 2.0 },
  ];
  const ids = (list: typeof products) => list.map((p) => p.id);

  it.each([
    ["featured", [1, 2, 3]],
    ["price-asc", [2, 3, 1]],
    ["price-desc", [1, 2, 3]],
    ["name-asc", [1, 3, 2]],
    ["name-desc", [2, 3, 1]],
    ["rating-desc", [1, 3, 2]],
  ] as const)("%s -> %j", (key, expected) => {
    expect(ids(sortProducts(products, key))).toEqual(expected);
  });

  it("breaks ties by id so pages are stable (no duplicates across pages)", () => {
    // ids 2 and 3 share the same price in both directions
    expect(ids(sortProducts(products, "price-asc")).slice(0, 2)).toEqual([2, 3]);
    expect(ids(sortProducts(products, "price-desc")).slice(1)).toEqual([2, 3]);
  });

  it("does not mutate the input", () => {
    const copy = [...products];
    sortProducts(products, "price-asc");
    expect(products).toEqual(copy);
  });
});