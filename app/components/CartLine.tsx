import { useRef } from "react";
import { Link, useFetcher } from "react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { MAX_QUANTITY } from "~/lib/cart";
import { formatPrice } from "~/lib/format";

export type CartLineData = {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  quantity: number; // already the optimistic value (see cart.tsx)
};

/** Fetcher key per line, so the cart page can read in-flight changes. */
export const CART_LINE_KEY_PREFIX = "cart-line-";
export const cartLineKey = (id: number) => `${CART_LINE_KEY_PREFIX}${id}`;

const stepButton =
  "flex size-8 items-center justify-center text-brand transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent";

export function CartLine({ line }: { line: CartLineData }) {
  const fetcher = useFetcher({ key: cartLineKey(line.id) });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { id, title, quantity } = line;

  const askToRemove = () => dialogRef.current?.showModal();

  const confirmRemove = () => {
    dialogRef.current?.close();
    fetcher.submit({ intent: "remove", id: String(id) }, { method: "post" });
  };

  // "−" at quantity 1 would submit quantity=0: ask first instead.
  // (Without JS there's no dialog and the form simply removes the item.)
  const handleStepperSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    if (submitter?.value === "0") {
      event.preventDefault();
      askToRemove();
    }
  };

  return (
    <li className="flex gap-4 border-b border-brand py-4 first:pt-0 sm:gap-6">
      <Link
        to={`/products/${id}`}
        className="size-28 shrink-0 bg-gray-200 sm:size-40"
        tabIndex={-1}
        aria-hidden
      >
        <img
          src={line.thumbnail}
          alt=""
          width={160}
          height={160}
          className="h-full w-full object-contain p-3 mix-blend-multiply"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <Link to={`/products/${id}`} className="text-brand hover:underline">
          {title}
        </Link>
        <p className="text-sm text-brand">{formatPrice(line.price)}</p>

        <div className="mt-auto flex items-center gap-3 pt-4">
          {/* Quantity stepper: the clicked button's value is the NEW quantity */}
          <fetcher.Form
            method="post"
            onSubmit={handleStepperSubmit}
            className="flex items-center overflow-hidden rounded-md border border-brand"
          >
            <input type="hidden" name="intent" value="set-quantity" />
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              name="quantity"
              value={quantity - 1}
              aria-label={`Decrease quantity of ${title}`}
              className={stepButton}
            >
              <Minus size={14} aria-hidden />
            </button>
            <output
              aria-live="polite"
              aria-label={`Quantity of ${title}`}
              className="w-8 text-center text-sm text-brand tabular-nums"
            >
              {quantity}
            </output>
            <button
              type="submit"
              name="quantity"
              value={quantity + 1}
              disabled={quantity >= MAX_QUANTITY}
              aria-label={`Increase quantity of ${title}`}
              title={quantity >= MAX_QUANTITY ? `Maximum ${MAX_QUANTITY} per item` : undefined}
              className={stepButton}
            >
              <Plus size={14} aria-hidden />
            </button>
          </fetcher.Form>

          <fetcher.Form
            method="post"
            onSubmit={(event) => {
              event.preventDefault();
              askToRemove();
            }}
          >
            <input type="hidden" name="intent" value="remove" />
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              aria-label={`Remove ${title} from cart`}
              className="rounded-md p-1.5 text-brand transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Trash2 size={20} strokeWidth={1.75} aria-hidden />
            </button>
          </fetcher.Form>
        </div>
      </div>

      {/* Native modal: focus is trapped inside, Esc closes it. */}
      <dialog
        ref={dialogRef}
        aria-labelledby={`remove-title-${id}`}
        className="m-auto w-[min(24rem,calc(100%-2rem))] rounded-xl p-6 text-brand shadow-xl backdrop:bg-black/40"
      >
        <h2 id={`remove-title-${id}`} className="text-lg font-semibold">
          Remove product?
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          <span className="font-medium text-brand">{title}</span> will be
          removed from your cart.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <form method="dialog">
            <button
              type="submit"
              autoFocus
              className="rounded-md border border-brand px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </form>
          <button
            type="button"
            onClick={confirmRemove}
            className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90"
          >
            Remove
          </button>
        </div>
      </dialog>
    </li>
  );
}