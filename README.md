# The Online Store

A small e-commerce app built for a coding exercise: browse products, sort and filter them, view a product's details, add it to a cart, and manage the cart. It is server-rendered with **React Router**, styled with **Tailwind CSS**, and backed by the [DummyJSON products API](https://dummyjson.com/docs/products).

## Getting started

**Requirements:** Node.js ≥ 22.22

```bash
npm install
cp .env.example .env
# then set SESSION_SECRET in .env, e.g.:
#   node -e "console.log(crypto.randomBytes(32).toString('hex'))"
npm run dev            # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server with HMR |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm test` | Run the unit tests once (Vitest) |
| `npm run test:watch` | Run the tests in watch mode |

## Features

**Homepage (`/`)**
- 3-column product grid (2 on tablet, 1 on mobile), 9 products per page
- Sorting: Featured, Price (low -> high / high -> low), Name (A–Z / Z–A), Top rated
- Multi-select category filter; first 4 categories visible, the rest behind "Show more"; collapsible panel on mobile
- Pagination with a sliding window (`1 … 8 9 10 … 22`); arrows are disabled, not hidden, at the ends
- "Showing x–y of z" summary

**Product detail (`/products/:id`)**
- Large image with a thumbnail gallery, title, price, description
- "Add to Cart" stays on the page and confirms with "Added ✓"; the header badge updates
- Real 404 page for unknown or invalid ids

**Cart (`/cart`)** - reachable from the bag icon in the header
- Line items with image, title, price, quantity stepper (max 10 per product) and remove button
- Removing an item (trash icon, or "−" at quantity 1) asks for confirmation first
- Quantities and totals update instantly (optimistic UI)
- Subtotal, flat $20 shipping, total; empty-cart screen with a link back to the shop

## Project structure

```
app/
├── routes.ts                  # route config (layout route + pages)
├── root.tsx                   # HTML document, fonts, root error boundary
├── routes/
│   ├── layout.tsx             # header + <Outlet/>; loader provides the cart count
│   ├── home.tsx               # product list: loader reads page/sort/category from the URL
│   ├── product.tsx            # detail page: loader + "add to cart" action
│   ├── cart.tsx               # cart page: loader + update/remove action
│   └── placeholder.tsx        # About / Contact / Blog ("coming soon")
├── components/                # Header, ProductCard, Pagination, SortSelect,
│                              # CategoryFilter, ProductGallery, AddToCartButton,
│                              # CartLine, CartSummary
└── lib/
    ├── api.server.ts          # typed DummyJSON client (server-only)
    ├── catalog.server.ts      # one page of products for any filter/sort combination
    ├── cart.server.ts         # signed cookie session for the cart
    ├── cart.ts                # pure cart logic + totals
    ├── pagination.ts          # page parsing, URL building, page-number window
    ├── sort.ts                # sort options, URL ↔ API mapping, in-app sorting
    ├── format.ts              # price formatting
    └── *.test.ts              # unit tests
```

## Design decisions


### The URL is the state
Page, sort and categories live in the query string (`/?sort=price-asc&category=beauty&category=laptops&page=2`). The homepage loader reads them, so refresh, back/forward and shared links all reproduce the same view, and no client-side state has to be kept in sync. Changing the sort or the categories resets to page 1; pagination keeps the other params. Invalid values (`?page=abc`, `?page=999`, `?sort=bogus`, unknown categories) **redirect** to the nearest valid URL, so the components never deal with impossible states.

### Loaders read, actions write
- All data fetching happens in loaders on the server (`*.server.ts` modules are never bundled for the browser).
- Mutations are `<Form>`/fetcher submissions handled by route actions: "add to cart" on the product route, "set quantity" and "remove" on the cart route. After an action, React Router revalidates the loaders, which is how the header badge stays correct without any client store.
- Forms are real HTML forms, so the core flows still work without JavaScript (with JS they're enhanced: no page reloads, optimistic updates, confirmation dialog).

### Multi-category filtering
DummyJSON filters by one category per request. With no category selected, the API sorts and paginates. With one or more selected, `catalog.server.ts` fetches each category in full **in parallel**, merges the results, sorts them (ties broken by id so pages are stable), and paginates on the server. Categories hold a handful of products each, so this stays cheap.

### The cart
- Stored in a **signed cookie session** (`httpOnly`, `sameSite=lax`, `secure` in production). The signature makes it tamper-proof; the app refuses to start without `SESSION_SECRET`.
- The cookie stores **only product ids and quantities - never prices.** The cart loader fetches each product from the API, so titles, images and prices are always current and can't be manipulated by the client.
- Totals are computed in **integer cents** to avoid floating-point rounding errors.
- Cookie contents are normalised on every read (types checked, duplicates removed, quantities capped at 10, at most 50 lines), which also keeps the cookie well under the 4 KB limit.
- Products that no longer exist are dropped from the cart and pruned from the cookie.

### Input validation
Everything from the URL or a form is validated before it's used: product ids must be positive integers before they reach an outgoing API URL, sort values and category slugs must be on known lists, cart actions accept only known intents with integer ids/quantities (anything else -> `400`), and the cart action can only change items already in the cart - adding goes through the product page, which verifies the product exists.

### Optimistic UI
Each cart line uses a fetcher with a known key. While a request is in flight, the cart page reads the pending quantity from `useFetchers()` and renders it - totals included - immediately. The stepper submits the *target* quantity (not "+1"), so rapid clicks resolve to the last value. When the action completes, the revalidated loader data takes over.

### Accessibility
Semantic landmarks and headings (visually hidden where the mockup has none), labelled icon buttons, `aria-current` for the active nav item and page, `aria-expanded` on toggles, disabled controls linked to an explanation, a native `<dialog>` for confirmations (focus trapping, Esc to close), live regions for "added to cart" and quantity changes, and visible focus styles throughout.

## Testing

`npm test` runs 52 unit tests (Vitest) covering the logic where bugs would be costly or subtle:

- `cart.test.ts` - add/limit/set/remove, normalising untrusted cookie data, totals in cents
- `pagination.test.ts` - page parsing, canonical URLs, the page-number window
- `sort.test.ts` - URL validation, API mapping, stable in-app sorting
- `catalog.server.test.ts` - the multi-category merge -> sort -> paginate path, with the API mocked

## Deviations from the mockups

- **Navigation:** the mockups disagree (Home/Shop/About/Contact/Blog vs. Home/Shop/Deals/Contact/Account); the homepage set is used everywhere. About, Contact and Blog are "coming soon" pages; Shop and Home both lead to the product list.
- **Mobile layouts** aren't in the mockups: the nav collapses into a hamburger menu and the category filter into a "Filters" panel.
- **Sort control** reads "Sort by: Featured ⌄" so the current choice stays visible.
- **Product detail** adds a thumbnail gallery for products with several images.
- **Cart totals** are calculated from real prices (the mockup's numbers are placeholders).
- **Fonts:** Bebas Neue for the logo, Inter elsewhere.
- **Search and account icons**, **Check out**, **PayPal** and **promo code** are shown but not functional.

## Known trade-offs

- **Cookie session concurrency:** each cart request reads and rewrites the whole cart, so two near-simultaneous changes to *different* lines can lose one. The UI corrects itself when loaders revalidate. A server-side store with atomic updates (database, Redis) would remove this.
- **Two sequential requests on the homepage:** categories are fetched first so the selected slugs can be validated before products are requested. The category list rarely changes and could be cached in memory.
- **The header badge isn't optimistic** - it updates when the request completes.