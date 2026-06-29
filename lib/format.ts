import { format, formatDistanceToNow, isPast, differenceInCalendarDays } from "date-fns";

/** Indian Rupee formatting with lakh/crore abbreviations for large numbers. */
export function inr(amount: number | null | undefined, opts?: { compact?: boolean }): string {
  const value = amount ?? 0;
  if (opts?.compact) {
    if (Math.abs(value) >= 1_00_00_000)
      return `₹${(value / 1_00_00_000).toFixed(2).replace(/\.00$/, "")}Cr`;
    if (Math.abs(value) >= 1_00_000)
      return `₹${(value / 1_00_000).toFixed(2).replace(/\.00$/, "")}L`;
    if (Math.abs(value) >= 1_000)
      return `₹${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Compact follower/view counts: 1.2M, 845K. */
export function compactNumber(n: number | null | undefined): string {
  const value = n ?? 0;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(value);
}

export function fullNumber(n: number | null | undefined): string {
  return new Intl.NumberFormat("en-IN").format(n ?? 0);
}

export function percent(n: number | null | undefined, digits = 1): string {
  return `${(n ?? 0).toFixed(digits)}%`;
}

export function dateShort(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return format(new Date(d), "d MMM yyyy");
}

export function dateLong(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return format(new Date(d), "EEE, d MMM yyyy");
}

export function relative(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return formatDistanceToNow(new Date(d), { addSuffix: true });
}

/** Returns days until due (negative = overdue), or null if no date. */
export function daysUntil(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  return differenceInCalendarDays(new Date(d), new Date());
}

export function isOverdue(d: Date | string | null | undefined): boolean {
  if (!d) return false;
  return isPast(new Date(d));
}
