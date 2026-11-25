import { Outlet } from "react-router";
import { Header } from "~/components/Header";
import { countItems } from "~/lib/cart";
import { getCartSession, readCart } from "~/lib/cart.server";
import type { Route } from "./+types/layout";

// Runs on every page (it's the parent of all routes) and again after
// any action, so the header badge is always in sync with the cookie.
export async function loader({ request }: Route.LoaderArgs) {
  const session = await getCartSession(request);
  return { cartCount: countItems(readCart(session)) };
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <Header cartCount={loaderData.cartCount} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </>
  );
}