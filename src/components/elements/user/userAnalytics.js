"use client";
import { useState, useEffect, useContext } from "react";
import ChartOne from "./Charts/ChartOne";
import ChartThree from "./Charts/ChartThree";
import ChartTwo from "./Charts/ChartTwo";

import { accumulateDataSeries, toMonthlySeries } from "@/helpers/dataHandlers";
import { DataContext } from "@/app/user/providers";
import { daysToNowArray, weeksToNowArray } from "@/helpers/formatters";

export default function UserAnalytics() {
  const { data, refreshData } = useContext(DataContext);
  const [dataParsed, setData] = useState('');

  useEffect(() => {
    if (!data) return;
    let year = null;
    let month = null;
    let week = null;
    if (data.length === 1) {
      year = toMonthlySeries(data[0].devices[0].notifications);
      const weeks = weeksToNowArray(8)
      const days7 = daysToNowArray(7)
      // console.log('weeks: ', weeks)
      month = accumulateDataSeries(data[0].devices[0].notifications, weeks)
      week = accumulateDataSeries(data[0].devices[0].notifications, days7, 'day')
    }
    setData({
      year,
      month,
      week
    });
  }, []);

  if (dataParsed) return (
    <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
      <ChartOne data={{ year: dataParsed.year, month: dataParsed.month }} />
      <ChartTwo data={dataParsed.week} />
      {/* <ChartTwo data={data2} /> */}
      {/* <ChartThree /> */}
    </div>
  );
}