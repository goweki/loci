const { monthNumToInit } = require("./formatters");

/**
 * Parse notificationsArray to object with monthly fields
 * @param {Object[]} data - array input
 * @returns {Object} - Object with month-number fields
 */
export function toMonthly(data) {
  // Initialize an empty object to store monthly totals
  const monthlyArrays = {};

  // Iterate through each data entry
  for (const entry of data) {
    const { date, type, message } = entry;
    const month = new Date(date).getMonth() + 1; // Extract the month part from the date (e.g., "1" for January)
    // console.log("Month ", month, " Condition ", !monthlyArrays[month]);
    if (!monthlyArrays[month]) monthlyArrays[month] = [];
    monthlyArrays[month].push({ date, type, message }); //push item into the {{month}} field
  }

  // return
  return monthlyArrays;
}
/**
* Return monthly total for each notification category
* @param {Object[]} data - array of dated notifications
* @return {Object} - Return object with monthly notification totals
*/
export function toMonthlyTotals(data) {
  // Initialize an empty object to store monthly totals
  const monthlyTotals = {};

  // Iterate through each data entry
  for (const entry of data) {
    const { date, type } = entry;
    const month = new Date(date).getMonth() + 1; // Extract the month part from the date (e.g., "1" for January)
    if (!monthlyTotals[month]) monthlyTotals[month] = {};
    const val = monthlyTotals[month][type] ? monthlyTotals[month][type] : 0
    monthlyTotals[month][type] = val + 1;
  }
  // return 
  return monthlyTotals;
}

// function weekName(dayNum) {
//   if (dayNum <= 7) return "week1";
//   else if (dayNum <= 14) return "week2";
//   else if (dayNum <= 21) return "week3";
//   else if (dayNum <= 31) return "week4";
//   else "";
// }

// export function calculateWeeklyTotals(monthNum, dailyDataArray) {
//   // Initialize an empty object to store monthly totals
//   let weeklyTotals = {};
//   // Iterate through each data entry
//   for (const entry of dailyDataArray) {
//     const { date, notifications, redAlerts } = entry;
//     //Extract the month part from the date (e.g., "JAN" for '01')
//     //   const month = monthNumToInit(Number(date.slice(3, 5)));

//     if (
//       monthNum === Number(date.slice(3, 5))
//       //   || monthNum === Number(date.slice(3, 5)) + 1
//     ) {
//       //create emptty nested obj
//       if (!weeklyTotals[weekName(Number(date.slice(0, 2)))]?.week) {
//         weeklyTotals[weekName(Number(date.slice(0, 2)))] = {
//           week: weekName(Number(date.slice(0, 2))),
//         };
//       }
//       // Accumulate notifications and redAlerts for the month
//       weeklyTotals[weekName(Number(date.slice(0, 2)))].notifications =
//         (weeklyTotals[weekName(Number(date.slice(0, 2)))].notifications || 0) +
//         notifications;
//       weeklyTotals[weekName(Number(date.slice(0, 2)))].redAlerts =
//         (weeklyTotals[weekName(Number(date.slice(0, 2)))].redAlerts || 0) +
//         redAlerts;
//     }
//   }
//   // Convert the object into an array of month objects
//   const result = Object.values(weeklyTotals);
//   return result;
// }
