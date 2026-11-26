import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductSummary } from "./api.server";

// Replace the real API with fakes - these tests are about our merge,
// sort and pagination logic, not about DummyJSON.
vi.mock("./api.server", () => ({
  getProducts: vi.fn(),
  getProductsByCategory: vi.fn(),
}));

const api = await import("./api.server");
const { getCatalogPage } = await import("./catalog.server");

const product = (id: number, price: number, category: string): ProductSummary => ({
  id,
  price,
  category,
  title: `Product ${id}`,
  thumbnail: "",
  rating: 4,
});

const byCategory: Record<string, ProductSummary[]> = {
  beauty: [product(1, 9.99, "beauty"), product(2, 19.99, "beauty")],
  laptops: [product(70, 1299, "laptops"), product(71, 499, "laptops")],
};

beforeEach(() => {
  vi.mocked(api.getProducts).mockReset();
  vi.mocked(api.getProductsByCategory).mockImplementation(async (slug) => ({
    products: byCategory[slug] ?? [],
    total: byCategory[slug]?.length ?? 0,
    skip: 0,
    limit: 0,
  }));
});

describe("getCatalogPage", () => {
  it("lets the API sort and paginate when no category is selected", async () => {
    vi.mocked(api.getProducts).mockResolvedValue({
      products: [],
      total: 194,
      skip: 9,
      limit: 9,
    });

    await getCatalogPage({ categories: [], sort: "price-asc", page: 2, pageSize: 9 });

    expect(api.getProducts).toHaveBeenCalledWith(
      { limit: 9, skip: 9, sortBy: "price", order: "asc" },
      undefined,
    );
    expect(api.getProductsByCategory).not.toHaveBeenCalled();
  });

  it("fetches each category in full and merges the results", async () => {
    const page = await getCatalogPage({
      categories: ["beauty", "laptops"],
      sort: "featured",
      page: 1,
      pageSize: 9,
    });

    expect(api.getProductsByCategory).toHaveBeenCalledTimes(2);
    expect(api.getProductsByCategory).toHaveBeenCalledWith(
      "beauty",
      { limit: 0, skip: 0 },
      undefined,
    );
    expect(page.total).toBe(4);
    expect(page.products.map((p) => p.id)).toEqual([1, 2, 70, 71]);
  });

  it("sorts across categories, then paginates", async () => {
    const query = { categories: ["beauty", "laptops"], sort: "price-desc" as const, pageSize: 3 };

    const first = await getCatalogPage({ ...query, page: 1 });
    const second = await getCatalogPage({ ...query, page: 2 });

    expect(first.products.map((p) => p.price)).toEqual([1299, 499, 19.99]);
    expect(second.products.map((p) => p.price)).toEqual([9.99]);
    expect(first.total).toBe(4);
  });
});