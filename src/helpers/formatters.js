import { addSubTime } from "./dataHandlers";

export function pascalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
* Returns short date string
* @param {Date} aDate - new Date() object
* @return {String} string **DD/MM/YYYY
*/
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

export function monthsToNowArray(monthCount, index_ = new Date().getMonth() + 1) {
  let arr = [];
  let index = index_ - 1;
  for (let i = 0; i < monthCount; i++) {
    // console.log("index: ", index, " ", months[index]);
    arr.unshift(months[index]);
    index -= 1;
    if (index < 0) index = 11;
  }
  // console.log('MONTHS: ', arr)
  return arr;
}

export function weeksToNowArray(weekCount, date = new Date()) {
  let _date = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  let arr = [date.toISOString()]
  for (let i = 0; i < weekCount; i++) {
    arr.unshift(addSubTime('days', -(7), _date).toISOString())
    // console.log('array +-7: ', arr)
  }
  return arr;
}

export function daysToNowArray(dayCount, date = new Date()) {
  let _date = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  let arr = [date.toISOString()]
  for (let i = 0; i < dayCount; i++) {
    arr.unshift(addSubTime('days', -(1), _date).toISOString())
    // console.log('array +-7: ', arr)
  }
  return arr;
}