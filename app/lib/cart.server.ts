import { createCookieSessionStorage, type Session } from "react-router";
import { normalizeCart, type Cart } from "./cart";

const secret = process.env.SESSION_SECRET;
if (!secret) {
  // Fail loudly at startup rather than signing cookies with a guessable key.
  throw new Error(
    "SESSION_SECRET is not set. Copy .env.example to .env and set a long random value.",
  );
}

type SessionData = { cart: Cart };

const storage = createCookieSessionStorage<SessionData>({
  cookie: {
    name: "__cart",
    httpOnly: true, // not readable from page JavaScript
    sameSite: "lax", // not sent on cross-site POSTs (CSRF mitigation)
    secure: process.env.NODE_ENV === "production", // HTTPS-only in prod
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    secrets: [secret], // signs the cookie so it can't be tampered with
  },
});

type CartSession = Session<SessionData>;

export function getCartSession(request: Request): Promise<CartSession> {
  return storage.getSession(request.headers.get("Cookie"));
}

export function readCart(session: CartSession): Cart {
  return normalizeCart(session.get("cart"));
}

/** Stores the cart and returns the Set-Cookie header value to send back. */
export function commitCart(session: CartSession, cart: Cart): Promise<string> {
  session.set("cart", cart);
  return storage.commitSession(session);
}