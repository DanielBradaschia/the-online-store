import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("products/:id", "routes/product.tsx"),
    route("cart", "routes/cart.tsx"),

    // Pages from the mockup's nav that aren't part of the exercise.
    // One module reused three times, so each needs a unique id.
    route("about", "routes/placeholder.tsx", { id: "about" }),
    route("contact", "routes/placeholder.tsx", { id: "contact" }),
    route("blog", "routes/placeholder.tsx", { id: "blog" }),
  ]),
] satisfies RouteConfig;