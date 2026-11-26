export type SortField = "price" | "title" | "rating";
export type SortOrder = "asc" | "desc";

type SortOption = {
  value: string;
  label: string;
  sortBy?: SortField;
  order?: SortOrder;
};

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High", sortBy: "price", order: "asc" },
  { value: "price-desc", label: "Price: High to Low", sortBy: "price", order: "desc" },
  { value: "name-asc", label: "Name: A–Z", sortBy: "title", order: "asc" },
  { value: "name-desc", label: "Name: Z–A", sortBy: "title", order: "desc" },
  { value: "rating-desc", label: "Top rated", sortBy: "rating", order: "desc" },
] as const satisfies readonly SortOption[];

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export const DEFAULT_SORT: SortKey = "featured";

/** Reads ?sort. Missing -> default; unknown value -> null (loader redirects). */
export function parseSort(raw: string | null): SortKey | null {
  if (raw === null) return DEFAULT_SORT;
  return SORT_OPTIONS.some((o) => o.value === raw) ? (raw as SortKey) : null;
}

/** Translates our URL value into DummyJSON's sortBy/order params. */
export function toApiSort(key: SortKey): { sortBy?: SortField; order?: SortOrder } {
  const option: SortOption = SORT_OPTIONS.find((o) => o.value === key)!;
  return { sortBy: option.sortBy, order: option.order };
}

type Sortable = { id: number; price: number; title: string; rating: number };

/**
 * Sorts products in our own code - used when results are merged from
 * several category requests, so the API can't sort them for us.
 * "Featured" = id order, which is DummyJSON's default order.
 * Ties fall back to id so the order is stable across pages.
 */
export function sortProducts<T extends Sortable>(products: T[], key: SortKey): T[] {
  const { sortBy, order } = toApiSort(key);
  const direction = order === "desc" ? -1 : 1;

  return [...products].sort((a, b) => {
    if (!sortBy) return a.id - b.id;
    const x = a[sortBy];
    const y = b[sortBy];
    const cmp =
      typeof x === "string" && typeof y === "string"
        ? x.localeCompare(y)
        : (x as number) - (y as number);
    return cmp * direction || a.id - b.id;
  });
}