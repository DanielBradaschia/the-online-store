import { redirect } from "react-router";
import { CategoryFilter } from "~/components/CategoryFilter";
import { Pagination } from "~/components/Pagination";
import { ProductCard } from "~/components/ProductCard";
import { SortSelect } from "~/components/SortSelect";
import { getCategories } from "~/lib/api.server";
import { getCatalogPage } from "~/lib/catalog.server";
import { parsePage, withPage } from "~/lib/pagination";
import { parseSort } from "~/lib/sort";
import type { Route } from "./+types/home";

const PAGE_SIZE = 9;

export function meta({}: Route.MetaArgs) {
  return [{ title: "The Online Store" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = parsePage(url.searchParams.get("page"));
  const sort = parseSort(url.searchParams.get("sort"));

  // ?page=abc, ?page=0, ?page=-1 -> back to page 1 (other params kept).
  if (page === null) {
    throw redirect(url.pathname + withPage(url.searchParams, 1));
  }

  // ?sort=whatever -> drop the unknown sort, keep everything else.
  if (sort === null) {
    url.searchParams.delete("sort");
    throw redirect(url.pathname + url.search);
  }

  // Only accept real category slugs (deduplicated); redirect otherwise.
  const categories = await getCategories(request.signal);
  const validSlugs = new Set(categories.map((c) => c.slug));
  const requested = url.searchParams.getAll("category");
  const selected = [...new Set(requested)].filter((slug) => validSlugs.has(slug));

  if (selected.length !== requested.length) {
    url.searchParams.delete("category");
    url.searchParams.delete("page");
    selected.forEach((slug) => url.searchParams.append("category", slug));
    throw redirect(url.pathname + url.search);
  }

  const { products, total } = await getCatalogPage(
    { categories: selected, sort, page, pageSize: PAGE_SIZE },
    request.signal,
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ?page=999 -> last real page.
  if (page > totalPages) {
    throw redirect(url.pathname + withPage(url.searchParams, totalPages));
  }

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  return {
    products,
    total,
    from,
    to: from + products.length - 1,
    page,
    totalPages,
    sort,
    categories,
    selected,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const {
    products,
    total,
    from,
    to,
    page,
    totalPages,
    sort,
    categories,
    selected,
  } = loaderData;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_12rem] xl:grid-cols-[1fr_14rem]">
      <section aria-labelledby="products-heading">
        <h1 id="products-heading" className="sr-only">
          Products
        </h1>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <SortSelect value={sort} />
          <p className="text-sm text-brand" aria-live="polite">
            Showing {from}–{to} of {total}
          </p>
        </div>

        {products.length === 0 ? (
          <p className="py-16 text-center text-gray-600">No products match these filters.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}

        <Pagination currentPage={page} totalPages={totalPages} />
      </section>

      {/* First on mobile (above the grid), right-hand column on desktop */}
      <aside aria-label="Filters" className="order-first lg:order-none">
        <CategoryFilter categories={categories} selected={selected} />
      </aside>
    </div>
  );
}