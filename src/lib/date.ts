/**
 * Backend timestamps → the strings the UI renders.
 *
 * All three are built from fixed parts rather than `toLocaleDateString` so the
 * output never depends on the runtime's locale.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parse(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Full date, e.g. "Jul 28, 2026". */
export function formatDate(value: string | null | undefined) {
  const date = parse(value);
  if (!date) return null;

  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** Short date the wireframe uses on list rows and cards, e.g. "Jul 20". */
export function formatShortDate(value: string | null | undefined) {
  const date = parse(value);
  if (!date) return null;

  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** A `Date` as its local calendar day, e.g. "2026-08-17". */
export function toDayString(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * The end of a calendar day, e.g. "2026-08-17T23:59:59".
 *
 * FastAPI parses a bare "2026-08-17" as that day's midnight, so a range whose
 * upper bound is a plain day silently excludes the day itself.
 */
export function toDayEnd(day: string) {
  return `${day}T23:59:59`;
}

/** Formats a backend timestamp for a date input, e.g. "2026-08-17". */
export function toDateInputValue(value: string | null | undefined) {
  const date = parse(value);
  if (!date) return "";

  return toDayString(date);
}
