// Formatters shared by Server and Client Components. Dates use a fixed time
// zone so server-rendered and client-rendered output always match.

const TIME_ZONE = "Asia/Karachi";

const numberFormat = new Intl.NumberFormat("en-US");

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: TIME_ZONE,
});

const longDateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const calendarDateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatPKR(value: number) {
  return `PKR ${numberFormat.format(value)}`;
}

export function formatNumber(value: number) {
  return numberFormat.format(value);
}

export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return dateTimeFormat.format(new Date(iso));
}

export function formatToday(date = new Date()) {
  return longDateFormat.format(date);
}

/**
 * Test ride dates are calendar days stored as UTC midnight, so they are
 * formatted in UTC to avoid shifting to the previous/next day.
 */
export function formatCalendarDate(iso: string) {
  return calendarDateFormat.format(new Date(iso));
}

/** "14:30" -> "2:30 PM" */
export function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** Short, readable order reference built from the last 6 characters of the id. */
export function orderRef(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}
