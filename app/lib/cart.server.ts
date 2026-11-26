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
    httpOnly: true, 
    sameSite: "lax", 
    secure: process.env.NODE_ENV === "production", 
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    secrets: [secret], 
  },
});

type CartSession = Session<SessionData>;

export function getCartSession(request: Request): Promise<CartSession> {
  return storage.getSession(request.headers.get("Cookie"));
}

export function readCart(session: CartSession): Cart {
  return normalizeCart(session.get("cart"));
}

export function commitCart(session: CartSession, cart: Cart): Promise<string> {
  session.set("cart", cart);
  return storage.commitSession(session);
}