export function formatINR(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function classNames(...c: Array<string | false | undefined | null>): string {
  return c.filter(Boolean).join(" ");
}