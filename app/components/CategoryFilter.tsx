import { useState } from "react";
import { Form, Link, useSearchParams, useSubmit } from "react-router";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { Category } from "~/lib/api.server";

const VISIBLE_COUNT = 4; // as in the mockup; the rest sit behind "Show more"

type Props = { categories: Category[]; selected: string[] };

export function CategoryFilter({ categories, selected }: Props) {
  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  // Start expanded if a selected category would otherwise be hidden.
  const [expanded, setExpanded] = useState(() =>
    categories.slice(VISIBLE_COUNT).some((c) => selected.includes(c.slug)),
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  // Keep sort (and anything else) but drop page: new filter -> page 1.
  const preserved = [...searchParams].filter(
    ([key]) => key !== "category" && key !== "page",
  );
  const clearQuery = new URLSearchParams(preserved).toString();
  const hiddenCount = categories.length - VISIBLE_COUNT;

  return (
    <div>
      {/* Mobile: the filter panel is collapsed behind a button. */}
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-md border border-brand px-3 py-2 text-sm text-brand lg:hidden"
        aria-expanded={mobileOpen}
        aria-controls="category-filter"
        onClick={() => setMobileOpen((open) => !open)}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={16} aria-hidden />
          Filters
          {selected.length > 0 && (
            <span className="rounded-full bg-brand px-2 text-xs text-white">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          className={`transition ${mobileOpen ? "rotate-180" : ""}`}
        />
      </button>

      <Form
        id="category-filter"
        method="get"
        // Reset the uncontrolled checkboxes whenever the URL changes.
        key={selected.join(",")}
        onChange={(event) =>
          submit(event.currentTarget, { preventScrollReset: true })
        }
        className={`${mobileOpen ? "block" : "hidden"} mt-4 border-b border-gray-400 pb-5 lg:mt-0 lg:block`}
      >
        {preserved.map(([key, value], i) => (
          <input key={`${key}-${i}`} type="hidden" name={key} value={value} />
        ))}

        <fieldset>
          <div className="mb-3 flex items-baseline justify-between">
            <legend className="text-sm text-brand">Categories</legend>
            {selected.length > 0 && (
              <Link
                to={clearQuery ? `?${clearQuery}` : "?"}
                preventScrollReset
                className="text-xs text-gray-600 underline underline-offset-2 hover:text-brand"
              >
                Clear
              </Link>
            )}
          </div>

          <ul className="space-y-2">
            {categories.map((category, index) => (
              <li
                key={category.slug}
                // Hidden, not removed: checked boxes still submit with the form.
                className={!expanded && index >= VISIBLE_COUNT ? "hidden" : ""}
              >
                <label className="flex cursor-pointer items-center gap-3 text-sm text-brand">
                  <input
                    type="checkbox"
                    name="category"
                    value={category.slug}
                    defaultChecked={selected.includes(category.slug)}
                    className="size-4 cursor-pointer rounded-sm border-gray-400 accent-brand"
                  />
                  {category.name}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        {hiddenCount > 0 && (
          <button
            type="button"
            className="mt-3 text-sm text-gray-600 underline underline-offset-2 hover:text-brand"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Show less" : `Show ${hiddenCount} more`}
          </button>
        )}

        <noscript>
          <button
            type="submit"
            className="mt-4 block rounded-md bg-brand px-3 py-1.5 text-sm text-white"
          >
            Apply
          </button>
        </noscript>
      </Form>
    </div>
  );
}