const { monthNumToInit, monthsToNowArray, weeklyDatesToNowArray, dateShort } = require("./formatters");
const maxHistory = process.env.NEXT_PUBLIC_MAX_HISTORY
/**
 * Return monthly total for each notification category
 * @param {Object[]} data - array of dated notifications
 * @return {Object} - Return object with monthly notification totals
 */
// export function toMonthlyTotals(data) {
//   // Initialize an empty object to store monthly totals
//   const monthlyTotals = {};

//   // Iterate through each data entry
//   for (const entry of data) {
//     const { date, type } = entry;
//     const month = new Date(date).getMonth() + 1; // Extract the month part from the date (e.g., "1" for January)
//     if (!monthlyTotals[month]) monthlyTotals[month] = {};
//     const val = monthlyTotals[month][type] ? monthlyTotals[month][type] : 0;
//     monthlyTotals[month][type] = val + 1;
//   }
//   // return
//   return monthlyTotals;
// }

/**
 * Return monthly data: [{green,data:[]},...]
 * @param {Object[]} data - array of dated notifications
 * @return {Object} - Return object with monthly notification totals
 */
export function toMonthlySeries(data) {
  // Initialize an empty object to store monthly totals
  const byTypeMonthlyObjs = {};
  const monthsArray = monthsToNowArray(maxHistory)
  // console.log('months: ', monthsArray)
  // const monthNow = new Date().getMonth();
  // console.log('maxhistory: ', maxHistory)

  // Iterate through each data entry
  for (const entry of data) {
    const { date, type } = entry;
    const month = new Date(date).getMonth() + 1; // Extract the month part from the date (e.g., "1" for January)
    if (!byTypeMonthlyObjs[type])
      byTypeMonthlyObjs[type] = { name: type, data: new Array(monthsArray.length).fill(0) };
    if (monthsArray.indexOf(monthNumToInit(month)) >= 0) {
      byTypeMonthlyObjs[type].data[monthsArray.indexOf(monthNumToInit(month))] += 1;
    }
  }
  // console.log("final: ", byTypeMonthlyObjs);
  return { labels: monthsArray, data: Object.values(byTypeMonthlyObjs) };
}

/**
 * Return monthly data: [{green,data:[]},...]
 * @param {Object[]} data - array of dated notifications
 * @return {Object} - Return object with monthly notification totals
 */
export function toWeeklySeries(data) {
  // Initialize an empty object to store monthly totals
  const byTypeWeeklyObjs = {};
  const weeksArray = weeksToNowArray()
  console.log('weeks: ', weeksArray)
  // const monthNow = new Date().getMonth();
  console.log('maxhistory: ', maxHistory)

  // Iterate through each data entry
  for (const entry of data) {
    const { date, type } = entry;
    const month = new Date(date).getMonth() + 1; // Extract the month part from the date (e.g., "1" for January)
    if (!byTypeWeeklyObjs[type])
      byTypeWeeklyObjs[type] = { name: type, data: new Array(weeksArray.length).fill(0) };
    if (weeksArray.indexOf(monthNumToInit(month)) >= 0) {
      console.log('There: ', weeksArray.indexOf(monthNumToInit(month)))
      byTypeWeeklyObjs[type].data[weeksArray.indexOf(monthNumToInit(month))] += 1;
    }
  }
  // console.log("final: ", byTypeMonthlyObjs);
  return { labels: weeksArray, data: Object.values(byTypeWeeklyObjs) };
}

export function accumulateDataSeries(data, timelinesArray) {
  // Initialize an empty object to store totals
  const byTypeObjs = {};
  // console.log('timelines: ', timelinesArray)
  timelinesArray.forEach((v, i, arr) => {
    // Iterate through each data entry
    for (const entry of data) {
      const { date, type } = entry;
      const theDate = new Date(date) // Convert date to Date type
      if (!byTypeObjs[type])
        byTypeObjs[type] = { name: type, data: new Array(timelinesArray.length - 1).fill(0) };
      if (!!arr[i + 1] && theDate > new Date(arr[i])
        && theDate <= new Date(arr[i + 1])) {
        // console.log('date: ', theDate)
        byTypeObjs[type].data[i] += 1;
      }
    }
  });
  let labels = timelinesArray.map((v, i) => `${dateShort(new Date(v))}`)
  labels.pop()
  // console.log("final: ", byTypeMonthlyObjs);
  return { labels, data: Object.values(byTypeObjs) };
}

export function addSubTime(regime, val, d = new Date()) {
  if (regime === "years") return new Date(d.setFullYear(d.getFullYear() + val));
  if (regime === "months") return new Date(d.setMonth(d.getMonth() + val));
  if (regime === "days") return new Date(d.setDate(d.getDate() + val));
}
