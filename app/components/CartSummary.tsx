import type { Totals } from "~/lib/cart";
import { formatPrice } from "~/lib/format";

export function CartSummary({ totals }: { totals: Totals }) {
  return (
    <section
      aria-labelledby="summary-heading"
      className="rounded-2xl border border-brand p-6"
    >
      <h2 id="summary-heading" className="text-xl font-bold text-brand">
        Cart Summary
      </h2>

      <dl className="mt-6 space-y-3 text-brand">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatPrice(totals.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd className="tabular-nums">{formatPrice(totals.shipping)}</dd>
        </div>
        <div className="flex justify-between text-lg">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatPrice(totals.total)}</dd>
        </div>
      </dl>

      <button
        type="button"
        disabled
        aria-describedby="checkout-note"
        className="mt-6 w-full rounded-md bg-brand px-4 py-2.5 font-mono text-sm tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        Check out
      </button>
      <button
        type="button"
        disabled
        aria-describedby="checkout-note"
        className="mx-auto mt-4 block text-sm text-brand disabled:cursor-not-allowed disabled:opacity-60"
      >
        Or pay with PayPal
      </button>
      <p id="checkout-note" className="mt-2 text-center text-xs text-gray-500">
        Checkout isn't available in this demo.
      </p>

      <div className="mt-6 border-t border-brand pt-5">
        <label htmlFor="promo-code" className="text-sm text-brand">
          Promo code
        </label>
        <div className="mt-2 flex gap-3">
          <input
            id="promo-code"
            type="text"
            placeholder="Enter code"
            disabled
            aria-describedby="promo-note"
            className="min-w-0 flex-1 rounded-md border border-brand px-3 py-2 text-brand placeholder:text-brand/70 disabled:cursor-not-allowed disabled:bg-gray-50"
          />
          <button
            type="button"
            disabled
            aria-describedby="promo-note"
            className="rounded-md bg-brand px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Apply
          </button>
        </div>
        <p id="promo-note" className="mt-2 text-xs text-gray-500">
          Promo codes aren't available in this demo.
        </p>
      </div>
    </section>
  );
}