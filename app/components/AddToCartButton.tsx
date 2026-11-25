import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { Check } from "lucide-react";

type ActionData = { ok: boolean; message: string };

export function AddToCartButton() {
  // A fetcher posts to this route's action without navigating:
  // no new history entry, no scroll jump — but loaders still revalidate,
  // so the header badge updates on its own.
  const fetcher = useFetcher<ActionData>();
  const busy = fetcher.state !== "idle";

  // Show "Added ✓" for 2 seconds after each successful add.
  const [justAdded, setJustAdded] = useState(false);
  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data?.ok) return;
    setJustAdded(true);
    const timer = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [fetcher.state, fetcher.data]);

  const error = fetcher.state === "idle" && fetcher.data && !fetcher.data.ok;

  return (
    <fetcher.Form method="post" className="mt-6">
      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 bg-brand px-4 py-2.5 font-mono text-sm tracking-wide text-white transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-80"
      >
        {busy ? (
          "Adding…"
        ) : justAdded ? (
          <>
            <Check size={16} aria-hidden /> Added
          </>
        ) : (
          "Add to Cart"
        )}
      </button>

      {/* Announced by screen readers; visible only for errors. */}
      <p
        role="status"
        className={error ? "mt-2 text-sm text-red-700" : "sr-only"}
      >
        {fetcher.state === "idle" ? (fetcher.data?.message ?? "") : ""}
      </p>
    </fetcher.Form>
  );
}