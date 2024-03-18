const { monthNumToInit } = require("./formatters");

export function calculateMonthlyTotals(dailyDataArray) {
  // Initialize an empty object to store monthly totals
  const monthlyTotals = {};
  // Iterate through each data entry
  for (const entry of dailyDataArray) {
    const { date, notifications, redAlerts } = entry;
    //Extract the month part from the date (e.g., "JAN" for '01')
    const month = monthNumToInit(Number(date.slice(3, 5)));
    // If the month doesn't exist in the monthlyTotals object, create it
    if (!monthlyTotals[month]) {
      monthlyTotals[month] = {
        month, // Store the month in a readable format (e.g., "01" for January)
        notifications: 0,
        redAlerts: 0,
      };
    }
    // Accumulate notifications and redAlerts for the month
    monthlyTotals[month].notifications += notifications;
    monthlyTotals[month].redAlerts += redAlerts;
  }

  // Convert the object into an array of month objects
  const result = Object.values(monthlyTotals);

  return result;
}

function weekName(dayNum) {
  if (dayNum <= 7) return "week1";
  else if (dayNum <= 14) return "week2";
  else if (dayNum <= 21) return "week3";
  else if (dayNum <= 31) return "week4";
  else "";
}

export function calculateWeeklyTotals(monthNum, dailyDataArray) {
  // Initialize an empty object to store monthly totals
  let weeklyTotals = {};
  // Iterate through each data entry
  for (const entry of dailyDataArray) {
    const { date, notifications, redAlerts } = entry;
    //Extract the month part from the date (e.g., "JAN" for '01')
    //   const month = monthNumToInit(Number(date.slice(3, 5)));

    if (
      monthNum === Number(date.slice(3, 5))
      //   || monthNum === Number(date.slice(3, 5)) + 1
    ) {
      //create emptty nested obj
      if (!weeklyTotals[weekName(Number(date.slice(0, 2)))]?.week) {
        weeklyTotals[weekName(Number(date.slice(0, 2)))] = {
          week: weekName(Number(date.slice(0, 2))),
        };
      }
      // Accumulate notifications and redAlerts for the month
      weeklyTotals[weekName(Number(date.slice(0, 2)))].notifications =
        (weeklyTotals[weekName(Number(date.slice(0, 2)))].notifications || 0) +
        notifications;
      weeklyTotals[weekName(Number(date.slice(0, 2)))].redAlerts =
        (weeklyTotals[weekName(Number(date.slice(0, 2)))].redAlerts || 0) +
        redAlerts;
    }
  }
  // Convert the object into an array of month objects
  const result = Object.values(weeklyTotals);
  return result;
}
