import { Link, useLocation } from "react-router";
import type { Route } from "./+types/placeholder";

function titleFromPath(pathname: string) {
  const slug = pathname.split("/").filter(Boolean)[0] ?? "";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function meta({ location }: Route.MetaArgs) {
  return [{ title: `${titleFromPath(location.pathname)} | The Online Store` }];
}

export default function Placeholder() {
  const { pathname } = useLocation();

  return (
    <section className="py-24 text-center">
      <h1 className="text-3xl font-semibold text-brand">{titleFromPath(pathname)}</h1>
      <p className="mt-2 text-gray-600">This page is coming soon.</p>
      <Link to="/" className="mt-6 inline-block text-sm text-brand underline underline-offset-4">
        Back to the shop
      </Link>
    </section>
  );
}