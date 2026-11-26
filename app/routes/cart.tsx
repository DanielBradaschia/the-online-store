import { data, Link, useFetchers } from "react-router";
import { ShoppingBag } from "lucide-react";
import { CART_LINE_KEY_PREFIX, CartLine } from "~/components/CartLine";
import { findProduct } from "~/lib/api.server";
import { computeTotals, removeItem, setQuantity } from "~/lib/cart";
import { commitCart, getCartSession, readCart } from "~/lib/cart.server";
import type { Route } from "./+types/cart";
import { CartSummary } from "~/components/CartSummary";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Cart | The Online Store" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getCartSession(request);
  const cart = readCart(session);

  const products = await Promise.all(
    cart.map((item) => findProduct(item.id, request.signal)),
  );

  const lines = cart.flatMap((item, i) => {
    const product = products[i];
    if (!product) return []; // product no longer exists -> drop it
    return [
      {
        id: product.id,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail,
        quantity: item.quantity,
      },
    ];
  });

  const payload = { lines };

  // If something vanished from the catalog, clean it out of the cookie too.
  if (lines.length !== cart.length) {
    const kept = cart.filter((item) => lines.some((l) => l.id === item.id));
    return data(payload, {
      headers: { "Set-Cookie": await commitCart(session, kept) },
    });
  }
  return payload;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");
  const id = Number(form.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    throw data("Invalid product id", { status: 400 });
  }

  const session = await getCartSession(request);
  let cart = readCart(session);

  switch (intent) {
    case "remove":
      cart = removeItem(cart, id);
      break;
    case "set-quantity": {
      const quantity = Number(form.get("quantity"));
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw data("Invalid quantity", { status: 400 });
      }
      cart = setQuantity(cart, id, quantity);
      break;
    }
    default:
      throw data("Unknown intent", { status: 400 });
  }

  return data(
    { ok: true },
    { headers: { "Set-Cookie": await commitCart(session, cart) } },
  );
}

function usePendingQuantities() {
  const pending = new Map<number, number>();
  for (const fetcher of useFetchers()) {
    if (!fetcher.key.startsWith(CART_LINE_KEY_PREFIX) || !fetcher.formData) continue;
    const id = Number(fetcher.formData.get("id"));
    const intent = fetcher.formData.get("intent");
    if (intent === "remove") pending.set(id, 0);
    if (intent === "set-quantity") {
      pending.set(id, Number(fetcher.formData.get("quantity")));
    }
  }
  return pending;
}

export default function Cart({ loaderData }: Route.ComponentProps) {
  const pending = usePendingQuantities();
  const lines = loaderData.lines
    .map((line) => ({ ...line, quantity: pending.get(line.id) ?? line.quantity }))
    .filter((line) => line.quantity > 0);
  const totals = computeTotals(lines);

  if (lines.length === 0) {
    return (
      <section className="py-24 text-center">
        <ShoppingBag size={48} strokeWidth={1.25} className="mx-auto text-gray-400" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold text-brand">Your cart is empty</h1>
        <p className="mt-2 text-gray-600">Looks like you haven't added anything yet.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-brand px-5 py-2.5 text-sm text-white transition hover:bg-brand/90"
        >
          Continue shopping
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12">
      <section aria-labelledby="cart-heading">
        <h1 id="cart-heading" className="sr-only">
          Shopping cart
        </h1>

        <ul>
          {lines.map((line) => (
            <CartLine key={line.id} line={line} />
          ))}
        </ul>
      </section>

      <aside className="lg:self-start">
        <CartSummary totals={totals} />
      </aside>
    </div>
  );
}