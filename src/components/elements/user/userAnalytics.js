"use client";
import { useState, useEffect, useContext } from "react";
import ChartOne from "./Charts/ChartOne";
import ChartThree from "./Charts/ChartThree";
import ChartTwo from "./Charts/ChartTwo";
import { useDate } from "@/lib/dateTime";

import {
  calculateWeeklyTotals,
  toMonthlyTotals,
} from "@/helpers/dataHandlers";
import { dummyYearNotifData } from "@/lib/configs";
import { DataContext } from "@/app/user/providers";

export default function UserAnalytics() {
  const { data, refreshData } = useContext(DataContext)
  const [dataParsed, setData] = useState()
  const { rawDate, month } = useDate();

  useEffect(() => {
    if (!data) return;
    let year_ = null
    if (data.length === 1) year_ = toMonthlyTotals(data[0].devices[0].notifications);
    //to store totals
    let yearMap = {
      green: {
        name: "green",
        data: []
      },
      amber: {
        name: "amber",
        data: []
      },
      red: {
        name: "red",
        data: []
      },
    }
    // map totals
    for (const [key, value] of Object.entries(year_)) {
      for (const [key_, value_] of Object.entries(value)) {
        yearMap[key_].data[key - 1] = value_
      }
    }
    // const month = calculateWeeklyTotals(12, dummyYearNotifData);
    setData({
      year: Object.values(yearMap),
    });
  }, []);

  return (
    <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
      <ChartOne data={dataParsed} />
      {/* <ChartTwo data={data2} /> */}
      {/* <ChartThree /> */}
    </div>
  );
}

const data1 = {
  year: [
    {
      name: "Notifications",
      data: [23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30, 45],
    },

    {
      name: "Red Alerts",
      data: [30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39, 51],
    },
  ],
  month: [],
};

const data2 = [
  {
    name: "Notifications",
    data: [44, 55, 41, 67, 22, 43, 65],
  },
  {
    name: "Red Alerts",
    data: [13, 23, 20, 8, 13, 27, 15],
  },
];
