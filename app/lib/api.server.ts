import { data } from "react-router";
import type { SortField, SortOrder } from "./sort";

const BASE_URL = "https://dummyjson.com";

/* ---------- Types ---------- */

export type Review = {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
};

export type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string; // not every product has a brand (e.g. groceries)
  sku: string;
  availabilityStatus: string;
  shippingInformation: string;
  warrantyInformation: string;
  returnPolicy: string;
  reviews: Review[];
  thumbnail: string;
  images: string[];
};

export type ProductSummary = Pick<
  Product,
  "id" | "title" | "price" | "thumbnail" | "category" | "rating"
>;

export type ProductsResponse = {
  products: ProductSummary[];
  total: number;
  skip: number;
  limit: number;
};

export type Category = {
  slug: string;
  name: string;
  url: string;
};


export type ListParams = {
  limit: number;
  skip: number;
  sortBy?: SortField;
  order?: SortOrder;
};

/* ---------- Internals ---------- */

// Only ask the API for what the grid renders.
const LIST_FIELDS = ["title", "price", "thumbnail", "category", "rating"];

function listQuery({ limit, skip, sortBy, order }: ListParams) {
  const params = new URLSearchParams({
    limit: String(limit),
    skip: String(skip),
    select: LIST_FIELDS.join(","),
  });
  if (sortBy) {
    params.set("sortBy", sortBy);
    params.set("order", order ?? "asc");
  }
  return params;
}

/**
 * Low-level request to DummyJSON. Returns null for a 404 so callers can
 * decide whether "missing" is an error; every other failure is converted
 * into a thrown Response, which React Router routes to the nearest
 * ErrorBoundary with the right status code.
 */
async function request(path: string, signal?: AbortSignal): Promise<Response | null> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { signal });
  } catch (error) {
    // Request aborted because the user navigated away: let it propagate.
    if (signal?.aborted) throw error;
    throw data("The product service is unreachable. Please try again.", {
      status: 503,
    });
  }

  if (res.status === 404) return null;
  if (!res.ok) {
    throw data("The product service returned an error.", { status: 502 });
  }
  return res;
}

/** Like request(), but a 404 is an error too (-> 404 page). */
async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await request(path, signal);
  if (!res) throw data("Not found", { status: 404 });
  return (await res.json()) as T;
}

/** Only positive integers are real product ids. */
function toProductId(id: string | number): number | null {
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
}

/* ---------- Public API ---------- */

export function getProducts(params: ListParams, signal?: AbortSignal) {
  return fetchJson<ProductsResponse>(
    `/products?${listQuery(params)}`,
    signal,
  );
}

export function getProductsByCategory(
  slug: string,
  params: ListParams,
  signal?: AbortSignal,
) {
  return fetchJson<ProductsResponse>(
    `/products/category/${encodeURIComponent(slug)}?${listQuery(params)}`,
    signal,
  );
}

export function getCategories(signal?: AbortSignal) {
  return fetchJson<Category[]>("/products/categories", signal);
}

export function getProduct(id: string | number, signal?: AbortSignal) {
  // Validate before it reaches the URL.
  const productId = toProductId(id);
  if (productId === null) throw data("Product not found", { status: 404 });
  return fetchJson<Product>(`/products/${productId}`, signal);
}

export async function findProduct(
  id: number,
  signal?: AbortSignal,
): Promise<Product | null> {
  const productId = toProductId(id);
  if (productId === null) return null;
  const res = await request(`/products/${productId}`, signal);
  return res ? ((await res.json()) as Product) : null;
}