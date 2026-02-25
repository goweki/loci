/**
 * Formats a given date as a short string (e.g., "15/07/2025") using "en-GB" locale.
 *
 * @param {Date} theDate - The date to format.
 * @returns {string} - The formatted date string.
 */
export function dateShort(theDate: Date): string {
  return new Intl.DateTimeFormat("en-GB").format(theDate);
}

/**
 * Formats a given date as a long string (e.g., "Tuesday, 15 July 2025") using "en-GB" locale.
 *
 * @param {Date} theDate - The date to format.
 * @returns {string} - The formatted date string.
 */
export function dateLong(theDate: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).formatToParts(theDate);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";

  return `${weekday}, ${day} ${month} ${year}`;
}

/**
 * Determines whether a given date has already passed (compared to current time).
 *
 * @param {Date} aDate - The date to check.
 * @param {Date} [refDate] - Optional reference date (defaults to now).
 * @returns {boolean} - `true` if the date is in the past, `false` otherwise.
 */
export function isDatePassed(aDate: Date, refDate?: Date): boolean {
  const now = refDate ? refDate.getTime() : Date.now();
  return now > aDate.getTime();
}

/**
 * Calculates the difference in hours between two dates.
 *
 * @param {Date} date1 - The first date.
 * @param {Date} date2 - The second date.
 * @returns {number} - The difference in hours (positive if `date1` > `date2`).
 */
export function hoursDifference(date1: Date, date2: Date): number {
  return (date1.getTime() - date2.getTime()) / 3600000;
}

/**
 * Adds a given number of days, months, and/or hours to a date.
 * Returns a new Date instance (does not mutate the original).
 *
 * @param {Object} options
 * @param {number} [options.days] - Number of days to add (can be negative).
 * @param {number} [options.months] - Number of months to add (can be negative).
 * @param {number} [options.hours] - Number of hours to add (can be negative).
 * @param {Date} [baseDate] - The starting date (defaults to now).
 * @returns {Date} - The updated date.
 */
export function addToDate(
  options: { days?: number; months?: number; hours?: number },
  baseDate: Date = new Date(),
): Date {
  const { days = 0, months = 0, hours = 0 } = options;

  const result = new Date(baseDate.getTime());

  // 1. Handle months first (avoids calendar rollover issues)
  if (months !== 0) {
    const originalDay = result.getDate();
    result.setMonth(result.getMonth() + months);

    // Fix month overflow (e.g., Jan 31 + 1 month → Feb 28/29)
    if (result.getDate() < originalDay) {
      result.setDate(0);
    }
  }

  // 2. Add days
  if (days !== 0) {
    result.setDate(result.getDate() + days);
  }

  // 3. Add hours
  if (hours !== 0) {
    result.setHours(result.getHours() + hours);
  }

  return result;
}
