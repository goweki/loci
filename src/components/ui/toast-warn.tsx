"use client";

import toast from "react-hot-toast";

export const toastWarn = (message: string) =>
  toast(message, {
    icon: "⚠️",
    className:
      "dark:bg-yellow-600 dark:text-yellow-100 font-medium px-4 py-2 rounded-md shadow-md border border-yellow-300",
  });
