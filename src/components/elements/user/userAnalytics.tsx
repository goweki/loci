"use client";
import { useState, useEffect, useContext } from "react";
import ChartOne from "./Charts/ChartOne";
import ChartThree from "./Charts/ChartThree";
import ChartTwo from "./Charts/ChartTwo";

import { accumulateDataSeries, toMonthlySeries } from "@/helpers/dataHandlers";
import { DataContext } from "@/app/user/providers";
import { daysToNowArray, weeksToNowArray } from "@/helpers/formatters";
import { Device } from "@prisma/client";

export default function UserAnalytics() {
  const { data, refreshData } = useContext(DataContext);
  const [dataParsed, setData] = useState<Record<string, any[]> | null>(null);

  useEffect(() => {
    if (!data) return;

    const notifications_ = extractNotifications(data.devices);

    let year = null;
    let month = null;
    let week = null;
    if (notifications_.length > 0) {
      year = toMonthlySeries(notifications_);
      const weeks = weeksToNowArray(8);
      const days7 = daysToNowArray(7);
      // console.log('weeks: ', weeks)
      month = accumulateDataSeries(notifications_, weeks);
      week = accumulateDataSeries(notifications_, days7);
    }
    setData({
      year,
      month,
      week,
    });
  }, [data]);

  if (dataParsed)
    return (
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <ChartOne data={{ year: dataParsed.year, month: dataParsed.month }} />
        <ChartTwo data={dataParsed.week} />
        {/* <ChartThree /> */}
      </div>
    );
}

function extractNotifications(devices: Device[]) {
  const notificationsArray = [];

  devices.forEach((device) => {
    if (device.notifications && device.notifications.length > 0) {
      device.notifications.forEach((notification) => {
        notificationsArray.push({
          message: notification.message,
          date: notification.date,
          deviceID: device.deviceID,
          deviceType: device.deviceType,
        });
      });
    }
  });

  return notificationsArray;
}
