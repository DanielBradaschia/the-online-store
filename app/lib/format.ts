const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** 19.9 -> "$19.90" */
export function formatPrice(value: number) {
  return currency.format(value);
}