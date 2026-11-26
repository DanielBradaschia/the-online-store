import { Link, useLocation } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPageItems, withPage } from "~/lib/pagination";

type Props = { currentPage: number; totalPages: number };

const baseItem =
  "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function Pagination({ currentPage, totalPages }: Props) {
  const { search } = useLocation();
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => withPage(search, page);

  return (
    <nav aria-label="Pagination" className="mt-10 flex justify-end">
      <ul className="flex items-center gap-1">
        <li>
          <Arrow
            direction="prev"
            to={currentPage > 1 ? hrefFor(currentPage - 1) : null}
          />
        </li>

        {getPageItems(currentPage, totalPages).map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <Link
                to={hrefFor(item)}
                aria-label={`Page ${item}`}
                aria-current={item === currentPage ? "page" : undefined}
                className={`${baseItem} ${
                  item === currentPage
                    ? "bg-brand text-white"
                    : "text-brand hover:bg-gray-100"
                }`}
              >
                {item}
              </Link>
            </li>
          ) : (
            <li key={item} aria-hidden className={`${baseItem} text-gray-500`}>
              …
            </li>
          ),
        )}

        <li>
          <Arrow
            direction="next"
            to={currentPage < totalPages ? hrefFor(currentPage + 1) : null}
          />
        </li>
      </ul>
    </nav>
  );
}

function Arrow({
  direction,
  to,
}: {
  direction: "prev" | "next";
  to: string | null;
}) {
  const label = direction === "prev" ? "Previous page" : "Next page";
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  if (to === null) {
    return (
      <span
        aria-disabled="true"
        aria-label={label}
        className={`${baseItem} cursor-not-allowed text-gray-300`}
      >
        <Icon size={18} aria-hidden />
      </span>
    );
  }

  return (
    <Link
      to={to}
      aria-label={label}
      rel={direction}
      className={`${baseItem} text-brand hover:bg-gray-100`}
    >
      <Icon size={18} aria-hidden />
    </Link>
  );
}