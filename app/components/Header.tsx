import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";

type NavItem = { label: string; to: string; showActive?: boolean };

const NAV_ITEMS: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/", showActive: false },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Blog", to: "/blog" },
];

const iconButton =
  "relative rounded-md p-1.5 text-brand transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

function navLinkClass(item: NavItem, isActive: boolean) {
  const active = isActive && item.showActive !== false;
  return [
    "text-sm text-brand transition hover:text-brand/70",
    active ? "font-semibold underline underline-offset-8" : "",
  ].join(" ");
}

export function Header({ cartCount = 0 }: { cartCount?: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  // Close it with the Escape key too.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="border-b border-brand/70 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`${iconButton} md:hidden`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>

          <Link
            to="/"
            className="font-display text-2xl tracking-wide text-brand uppercase sm:text-3xl"
          >
            The Online Store
          </Link>
        </div>

        {/* Center: desktop nav */}
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-10">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) => navLinkClass(item, isActive)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Search and account are visual-only for now (out of scope). */}
          <button type="button" className={`${iconButton} hidden sm:block`} aria-label="Search">
            <Search size={22} strokeWidth={1.75} aria-hidden />
          </button>
          <button type="button" className={`${iconButton} hidden sm:block`} aria-label="Account">
            <User size={22} strokeWidth={1.75} aria-hidden />
          </button>
          <Link
            to="/cart"
            className={iconButton}
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
          >
            <ShoppingBag size={22} strokeWidth={1.75} aria-hidden />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-medium text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <nav id="mobile-menu" aria-label="Main" className="border-t border-gray-200 md:hidden">
          <ul className="flex flex-col px-4 py-2 sm:px-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) => `block py-3 ${navLinkClass(item, isActive)}`}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}