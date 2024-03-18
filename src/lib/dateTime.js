"use client";
import { dayNumToInit, monthNumToInit } from "@/helpers/formatters";
import { useEffect, useState } from "react";

export function useDate() {
  const locale = "en";
  const [today, setDate] = useState(new Date()); // Save the current date in state to be able to trigger an update

  useEffect(() => {
    const timer = setInterval(() => {
      // Creates an interval which will update the current data every minute
      // This will trigger a rerender at every component that uses the useDate hook.
      setDate(new Date());
    }, 60 * 1000);
    return () => {
      clearInterval(timer); // Return a funtion to clear the timer so that it will stop being called on unmount
    };
  }, []);

  function rawDate() {
    return today;
  }

  function time() {
    const time = today.toLocaleTimeString(locale, {
      hour: "numeric",
      hour12: true,
      minute: "numeric",
    });
    return time;
  }
  function day() {
    const dayIndex = today.getDay();
    return dayNumToInit(dayIndex + 1);
  }
  function month() {
    const monthIndex = today.getMonth();
    return monthNumToInit(monthIndex + 1);
  }
  function year() {
    const fullYear = today.getFullYear();
    return fullYear;
  }

  function dateStr() {
    const day = today.toLocaleDateString(locale, { weekday: "long" });
    const date = `${day}, ${today.getDate()} ${today.toLocaleDateString(
      locale,
      {
        month: "long",
      }
    )}`;
    return date;
  }

  function wish() {
    const hour = today.getHours();
    const wish = `Good ${
      (hour < 12 && "morning") || (hour < 17 && "afternoon") || "evening"
    }, `;
    return wish;
  }

  return {
    rawDate,
    time,
    day,
    month,
    year,
    dateStr,
    wish,
  };
}
