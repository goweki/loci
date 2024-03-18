"use client";
import { useState, useEffect } from "react";
import ChartOne from "./Charts/ChartOne";
import ChartThree from "./Charts/ChartThree";
import ChartTwo from "./Charts/ChartTwo";
import { useDate } from "@/lib/dateTime";
import {
  subtractDays,
  subtractMonths,
  subtractYears,
} from "@/helpers/formatters";
import {
  calculateMonthlyTotals,
  calculateWeeklyTotals,
} from "@/helpers/dataHandlers";
import { dummyYearNotifData } from "@/lib/configs";

export default function UserAnalytics() {
  const [data, setData] = useState("");
  const { rawDate, month } = useDate();

  useEffect(() => {
    const year = calculateMonthlyTotals(dummyYearNotifData);
    const month = calculateWeeklyTotals(12, dummyYearNotifData);
    setData({
      year: [
        { name: "Notifications", data: year.map((v) => v.notifications) },
        { name: "Red Alerts", data: year.map((v) => v.redAlerts) },
      ],
      month,
    });
  }, []);

  return (
    <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
      <ChartOne data={data} />
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
