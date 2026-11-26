import { describe, expect, it } from "vitest";
import { getPageItems, parsePage, withPage } from "./pagination";

/** Renders page items the way the UI shows them, e.g. "1 … 8 9 10 … 22". */
const show = (items: ReturnType<typeof getPageItems>) =>
  items.map((item) => (typeof item === "number" ? item : "…")).join(" ");

describe("parsePage", () => {
  it("defaults to page 1 when the param is missing", () => {
    expect(parsePage(null)).toBe(1);
  });

  it("accepts positive integers", () => {
    expect(parsePage("1")).toBe(1);
    expect(parsePage("22")).toBe(22);
  });

  it.each(["abc", "0", "-2", "1.5", "", " 3", "2e1"])(
    "rejects %j",
    (raw) => {
      expect(parsePage(raw)).toBeNull();
    },
  );
});

describe("withPage", () => {
  it("sets the page and keeps other params", () => {
    expect(withPage("sort=price-asc&category=beauty", 3)).toBe(
      "?sort=price-asc&category=beauty&page=3",
    );
  });

  it("drops ?page for page 1 (canonical URL)", () => {
    expect(withPage("sort=price-asc&page=4", 1)).toBe("?sort=price-asc");
    expect(withPage("page=4", 1)).toBe("?");
  });

  it("keeps repeated params like multiple categories", () => {
    expect(withPage("category=a&category=b", 2)).toBe(
      "?category=a&category=b&page=2",
    );
  });
});

describe("getPageItems", () => {
  it("lists every page when there are 7 or fewer", () => {
    expect(show(getPageItems(1, 1))).toBe("1");
    expect(show(getPageItems(4, 7))).toBe("1 2 3 4 5 6 7");
  });

  it.each([
    [1, "1 2 3 4 5 … 22"],
    [4, "1 2 3 4 5 … 22"],
    [5, "1 … 4 5 6 … 22"],
    [9, "1 … 8 9 10 … 22"],
    [19, "1 … 18 19 20 21 22"],
    [22, "1 … 18 19 20 21 22"],
  ])("page %i of 22 -> %s", (current, expected) => {
    expect(show(getPageItems(current, 22))).toBe(expected);
  });

  it("always renders 7 slots once there are more than 7 pages", () => {
    for (let page = 1; page <= 22; page++) {
      expect(getPageItems(page, 22)).toHaveLength(7);
    }
  });
});