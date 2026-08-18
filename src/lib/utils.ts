import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const pesoWithCentavosFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Builds initials from a name like "S. Galvis" → "SG". The avatar fallback
 * everywhere, since the backend carries no profile image.
 */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part.replace(/\W/g, "").charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Formats an amount as pesos, e.g. 84200 → "₱84,200". */
export function formatCurrency(amount: number, withCentavos = false) {
  return withCentavos
    ? pesoWithCentavosFormatter.format(amount)
    : pesoFormatter.format(amount);
}

/**
 * The message a rejected query or mutation carries. Everything the UI catches
 * has already been through `bffRequest`, which throws `BffError` with user-safe
 * copy — the fallback only covers a value that isn't an `Error` at all.
 */
export function errorMessage(
  error: unknown,
  fallback = "Something went wrong.",
) {
  return error instanceof Error ? error.message : fallback;
}
