export type PageItem = number | "ellipsis-start" | "ellipsis-end";

/**
 * Reads ?page from the URL. Returns null when it isn't a positive integer
 * (e.g. "abc", "0", "-2", "1.5"), so the loader can redirect.
 */
export function parsePage(raw: string | null): number | null {
  if (raw === null) return 1;
  if (!/^\d+$/.test(raw)) return null;
  const page = Number(raw);
  return page >= 1 ? page : null;
}

/** Returns a "?..." search string with `page` set, keeping other params. */
export function withPage(search: string | URLSearchParams, page: number) {
  const params = new URLSearchParams(search);
  // Page 1 is the default - keep canonical URLs clean.
  if (page <= 1) params.delete("page");
  else params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "?";
}

/**
 * Page numbers to render, always 7 slots once there are enough pages:
 *   current=1  -> 1 2 3 4 5 … 22
 *   current=9  -> 1 … 8 9 10 … 22
 *   current=22 -> 1 … 18 19 20 21 22
 * A fixed slot count keeps the control from changing width as you page.
 */
export function getPageItems(current: number, totalPages: number): PageItem[] {
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i);

  const SLOTS = 7; // first + last + current + 2 siblings + 2 ellipses
  if (totalPages <= SLOTS) return range(1, totalPages);

  if (current <= 4) return [...range(1, 5), "ellipsis-end", totalPages];
  if (current >= totalPages - 3)
    return [1, "ellipsis-start", ...range(totalPages - 4, totalPages)];

  return [
    1,
    "ellipsis-start",
    current - 1,
    current,
    current + 1,
    "ellipsis-end",
    totalPages,
  ];
}