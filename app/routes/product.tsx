import {
  data,
  isRouteErrorResponse,
  Link,
  type ShouldRevalidateFunctionArgs,
} from "react-router";
import { AddToCartButton } from "~/components/AddToCartButton";
import { ProductGallery } from "~/components/ProductGallery";
import { getProduct } from "~/lib/api.server";
import { addItem, MAX_QUANTITY } from "~/lib/cart";
import { commitCart, getCartSession, readCart } from "~/lib/cart.server";
import { formatPrice } from "~/lib/format";
import type { Route } from "./+types/product";

export async function loader({ params, request }: Route.LoaderArgs) {
  // Throws a 404 for unknown/invalid ids → ErrorBoundary below.
  const product = await getProduct(params.id, request.signal);

  // Send the browser only what this page renders, not the full object
  // (reviews, meta, dimensions…).
  return {
    product: {
      id: product.id,
      title: product.title,
      price: product.price,
      description: product.description,
      images: product.images.length > 0 ? product.images : [product.thumbnail],
    },
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  // Never trust the client about what exists: confirm the product is real
  // (throws 404 otherwise). The id comes from the URL, not the form body.
  const product = await getProduct(params.id, request.signal);

  const session = await getCartSession(request);
  const result = addItem(readCart(session), product.id);

  if (result.status === "limit") {
    return data(
      {
        ok: false,
        message: `You can add up to ${MAX_QUANTITY} of this item.`,
      },
      { status: 400 },
    );
  }

  return data(
    { ok: true, message: `${product.title} was added to your cart.` },
    { headers: { "Set-Cookie": await commitCart(session, result.cart) } },
  );
}

// Adding to the cart doesn't change the product, so skip re-fetching it
// from DummyJSON after our own action. (The layout loader still re-runs,
// which is what updates the header badge.)
export function shouldRevalidate({
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (formMethod === "POST") return false;
  return defaultShouldRevalidate;
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Product not found | The Online Store" }];
  const { product } = loaderData;
  return [
    { title: `${product.title} | The Online Store` },
    { name: "description", content: product.description },
  ];
}

export default function Product({ loaderData }: Route.ComponentProps) {
  const { product } = loaderData;

  return (
    <article className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12">
      {/* key: start at the first image again when navigating to another product */}
      <ProductGallery key={product.id} images={product.images} title={product.title} />

      <div>
        <h1 className="text-3xl font-bold text-brand">{product.title}</h1>
        <p className="mt-1 text-3xl font-bold text-brand">
          {formatPrice(product.price)}
        </p>

        {/* Becomes a real <Form method="post"> + action in step 10 */}
        <AddToCartButton />

        <section className="mt-6 border-t border-brand pt-6" aria-labelledby="details-heading">
          <h2 id="details-heading" className="text-sm text-brand">
            Product Details
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-brand">
            {product.description}
          </p>
        </section>
      </div>
    </article>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section className="py-24 text-center">
      <h1 className="text-3xl font-semibold text-brand">
        {notFound ? "Product not found" : "Something went wrong"}
      </h1>
      <p className="mt-2 text-gray-600">
        {notFound
          ? "This product doesn't exist or is no longer available."
          : "We couldn't load this product. Please try again in a moment."}
      </p>
      <Link
        to="/"
        className="mt-6 inline-block bg-brand px-4 py-2 text-sm text-white"
      >
        Back to the shop
      </Link>
    </section>
  );
}