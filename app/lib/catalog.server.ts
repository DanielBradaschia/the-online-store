import {
  getProducts,
  getProductsByCategory,
  type ProductsResponse,
} from "./api.server";
import { sortProducts, toApiSort, type SortKey } from "./sort";

type CatalogQuery = {
  categories: string[];
  sort: SortKey;
  page: number;
  pageSize: number;
};

/**
 * One page of the product catalog, whatever the filters.
 *
 * - No category: DummyJSON sorts and paginates for us.
 * - One or more categories: the API can only filter by one category per
 *   request, so we fetch each selected category in full (in parallel),
 *   merge, then sort and paginate here. Categories are small, so this
 *   stays cheap. Single-category goes through the same path, so there's
 *   one behaviour to reason about.
 */
export async function getCatalogPage(
  { categories, sort, page, pageSize }: CatalogQuery,
  signal?: AbortSignal,
): Promise<ProductsResponse> {
  const skip = (page - 1) * pageSize;

  if (categories.length === 0) {
    return getProducts({ limit: pageSize, skip, ...toApiSort(sort) }, signal);
  }

  const results = await Promise.all(
    categories.map((slug) =>
      // limit: 0 -> every product in the category
      getProductsByCategory(slug, { limit: 0, skip: 0 }, signal),
    ),
  );

  const merged = sortProducts(
    results.flatMap((result) => result.products),
    sort,
  );

  return {
    products: merged.slice(skip, skip + pageSize),
    total: merged.length,
    skip,
    limit: pageSize,
  };
}