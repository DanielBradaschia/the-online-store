import { Form, useSearchParams, useSubmit } from "react-router";
import { ChevronDown } from "lucide-react";
import { DEFAULT_SORT, SORT_OPTIONS, type SortKey } from "~/lib/sort";

export function SortSelect({ value }: { value: SortKey }) {
  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  // Everything except sort/page, carried along as hidden inputs so the
  // no-JS form submit keeps e.g. the category filter (step 7).
  const preserved = [...searchParams].filter(
    ([key]) => key !== "sort" && key !== "page",
  );

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams);
    params.delete("page"); // a new order starts from page 1
    if (event.target.value === DEFAULT_SORT) params.delete("sort");
    else params.set("sort", event.target.value);

    submit(params, { method: "get", preventScrollReset: true });
  }

  return (
    <Form method="get" className="flex items-center gap-2">
      {preserved.map(([key, val], i) => (
        <input key={`${key}-${i}`} type="hidden" name={key} value={val} />
      ))}

      <div className="relative inline-flex items-center rounded-md border border-brand text-sm text-brand focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand">
        <label htmlFor="sort" className="pl-3 whitespace-nowrap">
          Sort by:
        </label>
        <select
          id="sort"
          name="sort"
          // key forces a reset when the URL changes (e.g. back button)
          key={value}
          defaultValue={value}
          onChange={handleChange}
          className="cursor-pointer appearance-none bg-transparent py-1.5 pr-8 pl-1 font-medium focus:outline-none"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          aria-hidden
          className="pointer-events-none absolute right-2.5"
        />
      </div>

      {/* Without JavaScript there's no onChange — offer a plain submit. */}
      <noscript>
        <button
          type="submit"
          className="rounded-md bg-brand px-3 py-1.5 text-sm text-white"
        >
          Apply
        </button>
      </noscript>
    </Form>
  );
}