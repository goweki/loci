export function pascalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function dateShort(aDate) {
  return new Intl.DateTimeFormat("en-GB").format(aDate);
}

export function dateFromShort(short) {
  const dateElements = short.split("/");
  return new Date(
    dateElements[2] + "-" + dateElements[1] + "-" + dateElements[0]
  );
}

export function isDatePassed(aDate) {
  if (new Date() > aDate) return true;
  else return false;
}

export function hoursDifference(date1, date2) {
  return (date1 - date2) / 3600000;
}

export const months = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export function monthNumToInit(monthnum) {
  return months[monthnum - 1] || "";
}
export function monthInitToNum(monthname) {
  return months.indexOf(monthname) + 1 || "";
}

export const days = ["SUN", "MON", "TUE", "WED", "THUR", "FRI", "SAT"];

export function dayNumToInit(daynum) {
  return days[daynum - 1] || "";
}
export function dayInitToNum(dayname) {
  return days.indexOf(dayname) + 1 || "";
}
