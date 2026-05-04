import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";

export const toastWarning = (message: string) => {
  return toast(message, {
    duration: 4000,
    position: "top-right",
    // Customizing the default toast to look like a Shadcn Alert
    icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    className:
      "border border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-sm font-medium shadow-md",
  });
};
