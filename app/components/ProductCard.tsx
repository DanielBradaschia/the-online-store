import { Link } from "react-router";
import type { ProductSummary } from "~/lib/api.server";
import { formatPrice } from "~/lib/format";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      <div className="aspect-square overflow-hidden bg-gray-200">
        <img
          src={product.thumbnail}
          alt={product.title}
          width={300}
          height={300}
          loading="lazy"
          className="h-full w-full object-contain p-6 mix-blend-multiply transition duration-300 group-hover:scale-105"
        />
      </div>
      <h2 className="mt-3 text-sm text-brand group-hover:underline">
        {product.title}
      </h2>
      <p className="text-sm text-brand">{formatPrice(product.price)}</p>
    </Link>
  );
}